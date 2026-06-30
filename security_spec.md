# Firestore Security Specification

This specification outlines the data invariants and safety profiles designed to protect the user data collections in **Tasko AI**.

## 1. Data Invariants

1. **User Ownership (Identity Isolation)**:
   - A user can only read, create, update, or delete data (Tasks, Events, Notes, Habits, Notifications) that belongs to them.
   - The `userId` field of any newly created or updated document must match the authenticated user's UID (`request.auth.uid`).
   - The `userId` field is immutable after creation.

2. **Id Path Variable Integrity**:
   - The document ID for any path variable (e.g., `taskId`, `eventId`, `noteId`, `habitId`, `notificationId`) must be a valid, standard identifier string (letters, numbers, hyphens, and underscores) and must not be unreasonably large (under 128 characters) to prevent resource injection or overflow attacks.

3. **Schema Integrity**:
   - Every write operation (create or update) must pass rigorous structural validation (e.g., `isValidTask`, `isValidNote`, `isValidHabit`, etc.).
   - Key attributes like `title`, `name`, `createdAt` are mandatory.
   - List size restrictions must be applied to tags and array fields to prevent "Denial of Wallet" resource bloat.

## 2. The "Dirty Dozen" Payloads

These 12 malicious payloads attempt to break security boundaries and must be rejected by the security rules:

1. **Payload 01: Identity Spoofing (Create Task for another user)**
   - Path: `/tasks/task-123`
   - Action: `create`
   - Content: `{ id: "task-123", title: "Malicious Task", userId: "victim_uid", ... }`
   - *Expectation*: `PERMISSION_DENIED` (auth UID mismatch).

2. **Payload 02: Unauthenticated Write (Create Note without signing in)**
   - Path: `/notes/note-456`
   - Action: `create`
   - Content: `{ id: "note-456", title: "Anonymous Note", userId: "attacker_uid", ... }`
   - *Expectation*: `PERMISSION_DENIED` (not signed in).

3. **Payload 03: Resource Poisoning (Giant Note title to blow up database reads)**
   - Path: `/notes/note-789`
   - Action: `create`
   - Content: `{ id: "note-789", title: "A".repeat(10000), userId: "attacker_uid", ... }`
   - *Expectation*: `PERMISSION_DENIED` (string size limit violated).

4. **Payload 04: Invalid ID Character Injection (Path escape/traversal attempt)**
   - Path: `/tasks/task-../malicious`
   - Action: `create`
   - Content: `{ id: "task-../malicious", title: "Injection", userId: "attacker_uid", ... }`
   - *Expectation*: `PERMISSION_DENIED` (invalid path or ID format).

5. **Payload 05: Note Immutability Bypass (Attempt to change creator UID of an existing note)**
   - Path: `/notes/note-111`
   - Action: `update`
   - Content: `{ id: "note-111", title: "Note", userId: "victim_uid" }`
   - *Expectation*: `PERMISSION_DENIED` (cannot change immutable `userId`).

6. **Payload 06: Habit Streak Shortcutting (Artificially set best streak to 99999)**
   - Path: `/habits/habit-222`
   - Action: `create`
   - Content: `{ id: "habit-222", name: "Short", userId: "attacker_uid", bestStreak: 99999, ... }`
   - *Expectation*: `PERMISSION_DENIED` (violates limits or type validations).

7. **Payload 07: Key Over-injection (Add unapproved "Ghost Fields" to profile or task)**
   - Path: `/tasks/task-333`
   - Action: `create`
   - Content: `{ id: "task-333", title: "Task", userId: "attacker_uid", ghostField: "injected", ... }`
   - *Expectation*: `PERMISSION_DENIED` (strict key/schema check).

8. **Payload 08: Missing Required Key (Creating Task without title)**
   - Path: `/tasks/task-444`
   - Action: `create`
   - Content: `{ id: "task-444", userId: "attacker_uid", isCompleted: false }`
   - *Expectation*: `PERMISSION_DENIED` (title is mandatory).

9. **Payload 09: Timestamp Spoofing (Setting future createdAt timestamp on Note)**
   - Path: `/notes/note-555`
   - Action: `create`
   - Content: `{ id: "note-555", title: "Bad Note", userId: "attacker_uid", createdAt: "2050-01-01T00:00:00Z" }`
   - *Expectation*: `PERMISSION_DENIED` (requires server/request time verification).

10. **Payload 10: Array Size Exhaustion (Adding 10,000 tags to Note)**
    - Path: `/notes/note-666`
    - Action: `create`
    - Content: `{ id: "note-666", title: "Note", userId: "attacker_uid", tags: ["tag"].repeat(10000) }`
    - *Expectation*: `PERMISSION_DENIED` (tags limit size exceeded).

11. **Payload 11: Notification Status Tampering (Mark other user's notifications as read)**
    - Path: `/notifications/notif-777`
    - Action: `update`
    - Content: `{ id: "notif-777", isRead: true, userId: "victim_uid" }`
    - *Expectation*: `PERMISSION_DENIED` (cannot write to other user's resources).

12. **Payload 12: Calendar Event Category Type Poisoning (Injecting object instead of string)**
    - Path: `/events/event-888`
    - Action: `create`
    - Content: `{ id: "event-888", title: "Event", userId: "attacker_uid", category: { malicious: "nested" } }`
    - *Expectation*: `PERMISSION_DENIED` (category must be a string).

---

## 3. The Test Runner Reference

A high-fidelity local test suite structure (`firestore.rules.test.ts`) that asserts:
- Unauthenticated users get rejected across all paths.
- Mismatched user IDs get rejected on both read and write.
- Valid schema and correct `userId` ownership requests succeed.
