// ── Shared JSDoc type definitions for IT Desk ──
// No TypeScript here — these are just editor hints via JSDoc, not enforced at build time.

/** @typedef {"high" | "med" | "low"} Priority */
/** @typedef {"todo" | "wip" | "done"} TaskStatus */
/** @typedef {"hardware" | "network" | "software" | "urgent"} TaskCategory */
/** @typedef {"routine" | "hardware" | "network" | "software" | "setup"} LogCategory */
/** @typedef {"staff" | "manager" | "admin"} UserRole */

// ── Asset Management ──
/** @typedef {"laptop" | "desktop" | "printer" | "ups" | "switch" | "server" | "monitor" | "phone" | "keyboard" | "other"} AssetType */
/** @typedef {"active" | "in_repair" | "retired" | "unassigned"} AssetStatus */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {string} [email] - optional — populated from session storage
 * @property {UserRole} role
 * @property {string} department
 * @property {number} [openTaskCount]
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {TaskCategory} category
 * @property {Priority} priority
 * @property {TaskStatus} status
 * @property {User} assignedTo
 * @property {User} [assignedBy] - if manager-created
 * @property {string} createdAt - "HH:MM" or "Mon", "today" etc.
 * @property {string} [dueDate]
 * @property {boolean} [isManagerAssigned]
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} id
 * @property {string} time - e.g. "09:00"
 * @property {string} description
 * @property {LogCategory} category
 * @property {string} date - "YYYY-MM-DD"
 */

/**
 * @typedef {Object} HandoverNote
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string} updatedAt - display string e.g. "Updated 28 Mar"
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} ReportSnapshot
 * @property {string} generatedAt
 * @property {User} generatedBy
 * @property {string} expiresIn
 * @property {string} token
 * @property {{todo: number, wip: number, done: number}} stats
 * @property {LogEntry[]} logs
 * @property {{label: string, title: string}[]} openTasks
 * @property {HandoverNote[]} handoverNotes
 */

/**
 * @typedef {Object} Asset
 * @property {string} id
 * @property {string} name - e.g. "HP LaserJet Pro M404dn"
 * @property {AssetType} type
 * @property {string} [serialNumber] - often found on a sticker on the device
 * @property {string} location - physical location e.g. "Production Office"
 * @property {string} department - owning department e.g. "HR"
 * @property {AssetStatus} status
 * @property {string} [purchaseDate] - ISO date string "YYYY-MM-DD"
 * @property {string} [warrantyExpiry]
 * @property {string} [notes]
 * @property {string} addedAt - display string e.g. "12 Jan 2025"
 */

// ── Sidebar nav item shape ──
/**
 * @typedef {Object} NavItem
 * @property {string} label
 * @property {string} icon
 * @property {string} href
 * @property {number} [count]
 * @property {"red" | "green"} [countVariant]
 */

export {};
