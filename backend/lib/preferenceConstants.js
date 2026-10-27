/**
 * Shared job preference options and validator.
 */
export const ALLOWED_ROLES = [
  "Software Engineer",
  "Full Stack",
  "Frontend",
  "Backend",
  "QA",
  "DevOps",
  "Mobile",
  "Data/AI",
  "UI/UX",
  "Intern/Trainee"
];

export const ALLOWED_LOCATIONS = [
  "Colombo",
  "Kandy",
  "Remote",
  "Hybrid",
  "Galle",
  "All Sri Lanka"
];

export const ALLOWED_JOB_TYPES = [
  "Full Time",
  "Part Time",
  "Contract",
  "Internship"
];

export const ALLOWED_EXPERIENCE_LEVELS = [
  "Intern / Trainee",
  "Entry / Junior (0-2 yrs)",
  "Mid-Level (2-5 yrs)",
  "Senior (5+ yrs)",
  "Lead / Architect"
];

export const DEFAULT_PREFERENCES = {
  roles: ["Software Engineer"],
  locations: ["Colombo", "Remote"],
  jobTypes: ["Full Time"],
  experienceLevel: "Mid-Level (2-5 yrs)",
  keywords: [],
  onboardingCompleted: false
};

/**
 * Validates a preferences payload.
 * Returns { valid: boolean, errors: string[], sanitized: object }
 */
export const validatePreferences = (payload = {}) => {
  const errors = [];

  // Roles validation
  let roles = payload.roles;
  if (roles !== undefined) {
    if (!Array.isArray(roles) || roles.length === 0) {
      errors.push("At least one target role must be selected.");
    } else {
      const invalidRoles = roles.filter(r => !ALLOWED_ROLES.includes(r));
      if (invalidRoles.length > 0) {
        errors.push(`Invalid role(s) selected: ${invalidRoles.join(", ")}`);
      }
    }
  } else {
    roles = DEFAULT_PREFERENCES.roles;
  }

  // Locations validation
  let locations = payload.locations;
  if (locations !== undefined) {
    if (!Array.isArray(locations)) {
      errors.push("Locations must be an array of strings.");
    } else {
      locations = locations.filter(l => typeof l === "string" && l.trim().length > 0);
    }
  } else {
    locations = DEFAULT_PREFERENCES.locations;
  }

  // Job Types validation
  let jobTypes = payload.jobTypes;
  if (jobTypes !== undefined) {
    if (!Array.isArray(jobTypes)) {
      errors.push("Job types must be an array of strings.");
    } else {
      const invalidTypes = jobTypes.filter(t => !ALLOWED_JOB_TYPES.includes(t));
      if (invalidTypes.length > 0) {
        errors.push(`Invalid job type(s): ${invalidTypes.join(", ")}`);
      }
    }
  } else {
    jobTypes = DEFAULT_PREFERENCES.jobTypes;
  }

  // Experience level validation
  let experienceLevel = payload.experienceLevel;
  if (experienceLevel !== undefined) {
    if (!ALLOWED_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      errors.push(`Invalid experience level. Allowed: ${ALLOWED_EXPERIENCE_LEVELS.join(", ")}`);
    }
  } else {
    experienceLevel = DEFAULT_PREFERENCES.experienceLevel;
  }

  // Keywords validation
  let keywords = payload.keywords;
  if (keywords !== undefined) {
    if (!Array.isArray(keywords)) {
      errors.push("Keywords must be an array of strings.");
    } else {
      keywords = keywords
        .map(k => String(k).trim())
        .filter(k => k.length > 0 && k.length <= 50)
        .slice(0, 30);
    }
  } else {
    keywords = [];
  }

  const onboardingCompleted = payload.onboardingCompleted !== undefined
    ? Boolean(payload.onboardingCompleted)
    : true;

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      roles,
      locations,
      jobTypes,
      experienceLevel,
      keywords,
      onboardingCompleted
    }
  };
};
