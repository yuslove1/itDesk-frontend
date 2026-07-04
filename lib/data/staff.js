// All staff in the department — each follows the User shape documented in @/types.
export const staffList = [
  {
    id: "adesina",
    name: "Adesina",
    initials: "AD",
    role: "staff",
    department: "IT Support · Dairies Plant",
    openTaskCount: 2,
  },
];

export const managerUser = {
  id: "lm",
  name: "L. Manager",
  initials: "LM",
  role: "manager",
  department: "IT Management · Dairies Plant",
};

// Simulated session — swap to managerUser to see manager views
export const currentUser = staffList[0];
