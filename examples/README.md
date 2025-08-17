# Firebridge Examples

This directory contains comprehensive code examples demonstrating how to use all Firebridge packages in real-world scenarios.

## 📦 Package Examples

### @firebridge/web
- **File**: `web-hooks-example.tsx`
- **Description**: React web application examples using Firebridge hooks for Firestore and Cloud Functions
- **Features Demonstrated**:
  - `FirebridgeProvider` setup with Firebase Web SDK
  - `useDocument` for real-time document subscriptions
  - `useCollection` for real-time collection queries with filtering
  - `useCallable` for calling Cloud Functions
  - `useCallableResponse` for functions that return data on mount
  - Dynamic path parts for flexible document/collection references
  - Error handling and loading states
  - TypeScript integration with proper typing

### @firebridge/cloud
- **File**: `cloud-functions-example.ts`
- **Description**: Firebase Cloud Functions examples using Firebridge server-side utilities
- **Features Demonstrated**:
  - `callableV2` for creating authenticated callable functions
  - Firestore actions (`firestoreGet`, `firestoreSet`, `firestoreUpdate`, `firestoreDelete`)
  - Batch operations with `executeFirestoreBatch`
  - Parallel execution with `executeFirestoreParallel`
  - Metrics tracking (`incrementMetric`, `updateMetric`)
  - Timestamp utilities (`hydrateTimestamp`, `timestampToDate`)
  - Permission-based access control
  - Input validation with Zod schemas
  - Custom permission checking logic
  - Snapshot reading utilities

### @firebridge/native
- **File**: `native-hooks-example.tsx`
- **Description**: React Native application examples using Firebridge hooks
- **Features Demonstrated**:
  - `FirebridgeProvider` setup with React Native Firebase
  - `useDocument` for real-time document subscriptions
  - `useCollection` for real-time collection queries
  - `useCallable` for calling Cloud Functions from React Native
  - `useDocumentState` for local state management with Firestore sync
  - Dynamic path parts handling
  - React Native UI components integration
  - Error handling with alerts
  - TypeScript integration

### @firebridge/cloud-stripe
- **File**: `cloud-stripe-example.ts`
- **Description**: Stripe integration examples for e-commerce functionality
- **Features Demonstrated**:
  - `onStripeCheckout` for creating checkout sessions
  - `onStripePaymentIntent` for payment intent handling
  - `stripeCheckoutWebhook` for handling Stripe webhook events
  - `stripePaymentIntentWebhook` for payment webhook handling
  - Custom checkout session creation with Stripe client
  - Order fulfillment workflows
  - Inventory management
  - Dynamic pricing and shipping options
  - Error handling and retry logic

### Common Types
- **File**: `types-usage-example.ts`
- **Description**: TypeScript utility types for consistent data modeling (copy these into your project)
- **Note**: These types are from an internal workspace package and should be copied into your own project
- **Features Demonstrated**:
  - `WithId<T>` for Firestore documents with IDs
  - `UserPermissions` for authorization and access control
  - `PlatformError` for standardized error handling
  - `FirestoreTimestamp` and `SerializedFirestoreTimestamp` for time handling
  - `PossiblyMissing<T>` for optional/nullable data
  - `EditorialMetadata` and `WithEditorialMetadata` for document tracking
  - Complex type composition examples
  - Error code validation and handling
  - Timestamp conversion utilities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Firebase project setup
- Stripe account (for cloud-stripe examples)

### Installation
```bash
# Install dependencies for web examples
npm install firebase react react-dom @firebridge/web

# Install dependencies for cloud examples  
npm install firebase-admin firebase-functions @firebridge/cloud zod

# Install dependencies for native examples
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/functions @firebridge/native

# Install dependencies for cloud-stripe examples
npm install firebase-admin firebase-functions stripe @firebridge/cloud-stripe @firebridge/cloud

# Note: Common types are included in the example file - copy them to your project
```

### Configuration

1. **Firebase Configuration**: Create a Firebase project and download your configuration
2. **Environment Variables**: Set up required environment variables (see individual example files)
3. **Stripe Configuration**: Set up Stripe secret keys and webhook endpoints (for stripe examples)

## 📖 Usage Patterns

### Real-time Data
All examples demonstrate real-time data synchronization using Firestore listeners. Data automatically updates in your UI when changes occur in the database.

### Authentication
Examples include proper authentication patterns with user state management and signed-in/signed-out states.

### Error Handling  
Comprehensive error handling patterns are demonstrated, including loading states, error boundaries, and user-friendly error messages.

### TypeScript
All examples are fully typed with TypeScript, showing best practices for type safety and developer experience.

### Performance
Examples include performance optimizations like:
- Conditional data fetching based on user state
- Efficient query patterns
- Proper dependency management for hooks

## 🔧 Customization

These examples are designed to be starting points for your own implementations. Key areas for customization:

- **Authentication**: Adapt authentication flows to your app's requirements
- **Data Models**: Modify interfaces and types to match your data structure  
- **UI Components**: Replace example UI components with your own design system
- **Business Logic**: Adapt the business logic to your specific use cases
- **Error Handling**: Customize error handling to match your app's UX patterns

## 📚 Additional Resources

- [Firebridge Documentation](https://docs.firebridge.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

## 📝 Code Standards

All examples follow the Firebridge coding standards:

- **Function Declarations**: Use `const` arrow function exports instead of `function` declarations
- **Single Returns**: Omit curly braces and return keyword for functions with only a return statement
- **Object Returns**: Use parentheses for multi-line object returns instead of explicit return statements
- **Consistency**: Maintain uniform patterns across all components and utilities

See [CODING_STANDARDS.md](../CODING_STANDARDS.md) for complete details.

### Examples
```typescript
// ✅ Correct function declaration
export const getUserData = async (userId: string) => {
  // complex logic here
  return userData;
};

// ✅ Correct single return
export const formatUser = (user: User) => ({ ...user, formatted: true });

// ✅ Correct object return
export const createUser = (data: UserInput) => ({
  id: generateId(),
  name: data.name,
  email: data.email
});
```

## 🤝 Contributing

If you find issues with these examples or have suggestions for improvements, please open an issue or submit a pull request. Make sure to follow the coding standards outlined above.