import { handle } from "hono/vercel";

// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
import index from "../dist/index.mjs";

export const runtime = "edge";

export const GET = handle(index);

export const POST = handle(index);

export const PUT = handle(index);

export const DELETE = handle(index);

export const PATCH = handle(index);

export const OPTIONS = handle(index);

export const HEAD = handle(index);
