import { https, RuntimeOptions } from 'firebase-functions'
import * as Yup from 'yup'
import * as express from 'express'

export type AuthenticatedContext = {
  auth: { uid: string }
}

export type InvokableAction<Body, Response> = (
  body: Body,
  context: AuthenticatedContext,
) => Response | Promise<Response>

export type BodyValidationSchema = Yup.AnyObjectSchema

export type InvokableRuntimeModes = {
  performance?: RuntimeOptions
  // these are applied for all modes
  default?: RuntimeOptions
}

export type OnCallHandler = (data: any, callable: https.CallableContext) => any

export type OnRequestHandler = (
  req: https.Request,
  res: express.Response,
) => Promise<any>
