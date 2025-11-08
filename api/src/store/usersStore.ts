export type UserRole = 'user' | 'admin';

export type ActiveUserRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  dob: string | null;
  preferredLanguage: string;
  role: UserRole;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type DeletedUserRecord = ActiveUserRecord & {
  deletedAt: string;
  deletionReason?: string | null;
  deletionRequestedBy: 'self' | 'admin' | 'system';
  deletionMetadata?: Record<string, unknown>;
};

type ArchiveOptions = {
  reason?: string | null;
  requestedBy?: 'self' | 'admin' | 'system';
  metadata?: Record<string, unknown>;
};

type CreateUserOptions = {
  id: string;
  name?: string;
  phone: string;
  email?: string | null;
  dob?: string | null;
  preferredLanguage?: string;
  role?: UserRole;
  metadata?: Record<string, unknown>;
};

const activeUsers = new Map<string, ActiveUserRecord>();
const deletedUsers: DeletedUserRecord[] = [];

function normalizePhone(phone: string) {
  return phone.replace(/[\s-]/g, '').replace(/\((.*?)\)/g, '$1');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createUser(options: CreateUserOptions): ActiveUserRecord {
  const record: ActiveUserRecord = {
    id: options.id,
    name: (options.name || '').trim(),
    phone: normalizePhone(options.phone),
    email: options.email ? normalizeEmail(options.email) : null,
    dob: options.dob || null,
    preferredLanguage: options.preferredLanguage || 'en',
    role: options.role || 'user',
    createdAt: new Date().toISOString(),
    metadata: options.metadata ? { ...options.metadata } : undefined,
  };

  activeUsers.set(record.id, record);
  return record;
}

export function getActiveUserById(id: string) {
  return activeUsers.get(id) || null;
}

export function findActiveUserByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  for (const user of activeUsers.values()) {
    if (normalizePhone(user.phone) === normalized) return user;
  }
  return null;
}

export function findActiveUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  for (const user of activeUsers.values()) {
    if (user.email && normalizeEmail(user.email) === normalized) return user;
  }
  return null;
}

export function archiveUserDeletion(userId: string, options: ArchiveOptions = {}) {
  const existing = activeUsers.get(userId);
  if (!existing) return null;

  activeUsers.delete(userId);

  const archived: DeletedUserRecord = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletionReason: options.reason ?? null,
    deletionRequestedBy: options.requestedBy || 'self',
    deletionMetadata: options.metadata ? { ...options.metadata } : undefined,
  };

  deletedUsers.push(archived);
  return archived;
}

export function listDeletedUsers() {
  return deletedUsers.map((item) => ({ ...item, metadata: item.metadata ? { ...item.metadata } : undefined, deletionMetadata: item.deletionMetadata ? { ...item.deletionMetadata } : undefined }));
}

export function getDeletedUserById(id: string) {
  const user = deletedUsers.find((item) => item.id === id);
  if (!user) return null;
  return { ...user, metadata: user.metadata ? { ...user.metadata } : undefined, deletionMetadata: user.deletionMetadata ? { ...user.deletionMetadata } : undefined };
}

export function clearAllUsers() {
  activeUsers.clear();
  deletedUsers.length = 0;
}
