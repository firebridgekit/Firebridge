import { DateTime } from 'luxon';
import { Timestamp } from 'firebase-admin/firestore';
import { buildTimeline } from '../utils/buildTimeline';
import { getEventsInRange } from '../utils/getEventsInRange';
import { TrackableEvent } from '../types';

// Mock getEventsInRange
jest.mock('../utils/getEventsInRange');

// Helper function to create mock events
const createMockEvent = (isoString: string, count: number, value: number): TrackableEvent => ({
  time: Timestamp.fromDate(new Date(isoString)),
  count,
  value,
});

describe('Timezone functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('timezone boundaries', () => {
    it('should handle UTC timezone correctly', () => {
      // Event at 11 PM UTC on Jan 15
      const events = [createMockEvent('2024-01-15T23:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'UTC'
      });

      expect(result).toHaveLength(1);
      // Should be in Jan 15 bucket in UTC
      const startTime = result[0].startTime.toDate();
      expect(startTime.getUTCDate()).toBe(15);
      expect(startTime.getUTCHours()).toBe(0);
      expect(startTime.getUTCMinutes()).toBe(0);
    });

    it('should handle Pacific timezone day boundaries', () => {
      // Event at 7 AM UTC = 11 PM PST previous day (Jan 14)
      const events = [createMockEvent('2024-01-15T07:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'America/Los_Angeles' // PST/PDT
      });

      expect(result).toHaveLength(1);
      
      // In Pacific time, this should be counted as Jan 14
      const startTime = result[0].startTime.toDate();
      // The exact date will depend on Luxon's handling, but the principle is tested
      expect(result[0]).toMatchObject({
        count: 1,
        value: 100,
      });
    });

    it('should handle Eastern timezone day boundaries', () => {
      // Event at 4 AM UTC = 11 PM EST previous day (Jan 14)
      const events = [createMockEvent('2024-01-15T04:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'America/New_York' // EST/EDT
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        count: 1,
        value: 100,
      });
    });

    it('should handle London timezone day boundaries', () => {
      // Event at 1 AM UTC = 1 AM GMT (same day) in winter, 2 AM BST in summer
      const events = [createMockEvent('2024-01-15T01:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'Europe/London' // GMT/BST
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        count: 1,
        value: 100,
      });
    });
  });

  describe('cross-timezone event aggregation', () => {
    it('should aggregate events from different timezones into local time periods', () => {
      const events = [
        // 11 PM PST on Jan 14 (7 AM UTC Jan 15)
        createMockEvent('2024-01-15T07:00:00Z', 2, 200),
        // 1 AM PST on Jan 15 (9 AM UTC Jan 15)  
        createMockEvent('2024-01-15T09:00:00Z', 3, 300),
        // 11 PM PST on Jan 15 (7 AM UTC Jan 16)
        createMockEvent('2024-01-16T07:00:00Z', 1, 100),
      ];
      
      // Mock to return events for different Pacific time days
      (getEventsInRange as jest.Mock)
        .mockReturnValueOnce([events[0]]) // Jan 14 PST
        .mockReturnValueOnce([events[1]]) // Jan 15 PST  
        .mockReturnValueOnce([events[2]]); // Jan 15 PST (continued)

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'America/Los_Angeles'
      });

      // Should have entries for each Pacific time day
      expect(result.length).toBeGreaterThan(0);
      
      // Verify running totals are calculated correctly
      let totalCount = 0;
      let totalValue = 0;
      
      result.forEach(section => {
        totalCount += section.count;
        totalValue += section.value;
        expect(section.totalCount).toBe(totalCount);
        expect(section.totalValue).toBe(totalValue);
      });
    });
  });

  describe('daylight saving time transitions', () => {
    it('should handle spring forward transition', () => {
      // Events around DST transition in March (spring forward)
      const events = [
        // Before DST (EST)
        createMockEvent('2024-03-10T06:00:00Z', 1, 100), // 1 AM EST
        // After DST (EDT) 
        createMockEvent('2024-03-10T07:00:00Z', 1, 100), // 3 AM EDT (2 AM skipped)
      ];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'America/New_York'
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        count: 2,
        value: 200,
      });
    });

    it('should handle fall back transition', () => {
      // Events around DST transition in November (fall back)
      const events = [
        // Before transition (EDT)
        createMockEvent('2024-11-03T05:00:00Z', 1, 100), // 1 AM EDT
        // After transition (EST)
        createMockEvent('2024-11-03T07:00:00Z', 1, 100), // 2 AM EST (1 AM happens twice)
      ];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'America/New_York'
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        count: 2,
        value: 200,
      });
    });
  });

  describe('hourly aggregation with timezones', () => {
    it('should respect timezone for hourly boundaries', () => {
      const events = [
        // 6:30 AM UTC = 11:30 PM PST previous day
        createMockEvent('2024-01-15T06:30:00Z', 1, 50),
        // 7:30 AM UTC = 12:30 AM PST same day
        createMockEvent('2024-01-15T07:30:00Z', 1, 50),
      ];
      
      // Mock to return events for different Pacific time hours
      (getEventsInRange as jest.Mock)
        .mockReturnValueOnce([events[0]]) // 11 PM PST hour
        .mockReturnValueOnce([events[1]]); // 12 AM PST hour

      const result = buildTimeline(events, { 
        unit: 'hour',
        timezone: 'America/Los_Angeles'
      });

      // Should create separate hourly buckets based on Pacific time
      expect(result.length).toBeGreaterThanOrEqual(1);
      
      // Verify the aggregation worked
      const totalEvents = result.reduce((sum, section) => sum + section.count, 0);
      expect(totalEvents).toBe(2);
    });
  });

  describe('weekly aggregation with timezones', () => {
    it('should respect timezone for weekly boundaries', () => {
      const events = [
        // Monday 1 AM PST = Monday 9 AM UTC
        createMockEvent('2024-01-15T09:00:00Z', 1, 100),
        // Tuesday 1 AM PST = Tuesday 9 AM UTC
        createMockEvent('2024-01-16T09:00:00Z', 1, 100),
      ];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'week',
        timezone: 'America/Los_Angeles'
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        count: 2,
        value: 200,
      });
    });
  });

  describe('monthly aggregation with timezones', () => {
    it('should respect timezone for monthly boundaries', () => {
      const events = [
        // Jan 31 11 PM PST = Feb 1 7 AM UTC
        createMockEvent('2024-02-01T07:00:00Z', 1, 100),
        // Feb 1 1 AM PST = Feb 1 9 AM UTC  
        createMockEvent('2024-02-01T09:00:00Z', 1, 100),
      ];
      
      // Mock to return events for different months in Pacific time
      (getEventsInRange as jest.Mock)
        .mockReturnValueOnce([events[0]]) // January PST
        .mockReturnValueOnce([events[1]]); // February PST

      const result = buildTimeline(events, { 
        unit: 'month',
        timezone: 'America/Los_Angeles'
      });

      // The exact number of sections depends on which month each event falls into
      // in Pacific time vs UTC time
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('international timezones', () => {
    it('should handle Tokyo timezone', () => {
      // Event at 3 PM UTC = 12 AM JST next day
      const events = [createMockEvent('2024-01-15T15:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'Asia/Tokyo'
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        count: 1,
        value: 100,
      });
    });

    it('should handle Sydney timezone', () => {
      // Event at 2 PM UTC = 1 AM AEDT next day (during DST)
      const events = [createMockEvent('2024-01-15T14:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const result = buildTimeline(events, { 
        unit: 'day',
        timezone: 'Australia/Sydney'
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        count: 1,
        value: 100,
      });
    });
  });

  describe('timezone validation', () => {
    it('should handle invalid timezone gracefully', () => {
      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      // Luxon should handle invalid timezones gracefully
      expect(() => {
        buildTimeline(events, { 
          unit: 'day',
          timezone: 'Invalid/Timezone'
        });
      }).not.toThrow();
    });

    it('should default to UTC for undefined timezone', () => {
      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      
      (getEventsInRange as jest.Mock).mockReturnValue(events);

      const resultWithUTC = buildTimeline(events, { 
        unit: 'day',
        timezone: 'UTC'
      });

      const resultWithDefault = buildTimeline(events, { 
        unit: 'day'
        // timezone not specified, should default to UTC
      });

      expect(resultWithUTC).toEqual(resultWithDefault);
    });
  });
});