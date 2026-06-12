import type { User } from "@workspace/api-client-react";

const user: User = {} as User;

// Intentional type probe.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const probe = user.avatarUrl;
