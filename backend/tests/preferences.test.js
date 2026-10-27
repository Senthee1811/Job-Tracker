import test from "node:test";
import assert from "node:assert";
import {
  validatePreferences,
  ALLOWED_ROLES,
  ALLOWED_LOCATIONS,
  ALLOWED_EXPERIENCE_LEVELS,
  DEFAULT_PREFERENCES
} from "../lib/preferenceConstants.js";
import { calculatePreferenceScore } from "../services/scoringService.js";

test("Preference validator: accepts valid preference payload", () => {
  const payload = {
    roles: ["Software Engineer", "Frontend"],
    locations: ["Colombo", "Remote"],
    jobTypes: ["Full Time", "Contract"],
    experienceLevel: "Senior (5+ yrs)",
    keywords: ["React", "GraphQL"],
    onboardingCompleted: true
  };

  const result = validatePreferences(payload);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.deepStrictEqual(result.sanitized.roles, ["Software Engineer", "Frontend"]);
  assert.strictEqual(result.sanitized.onboardingCompleted, true);
});

test("Preference validator: rejects empty roles or invalid role names", () => {
  // Empty roles
  const emptyRoles = validatePreferences({ roles: [] });
  assert.strictEqual(emptyRoles.valid, false);
  assert.ok(emptyRoles.errors.some(e => e.includes("At least one target role")));

  // Invalid role name
  const invalidRole = validatePreferences({ roles: ["Dentist", "Accountant"] });
  assert.strictEqual(invalidRole.valid, false);
  assert.ok(invalidRole.errors.some(e => e.includes("Invalid role(s) selected")));
});

test("Preference validator: rejects invalid experience level", () => {
  const invalidExp = validatePreferences({
    roles: ["Software Engineer"],
    experienceLevel: "Super Guru 20+ yrs"
  });
  assert.strictEqual(invalidExp.valid, false);
  assert.ok(invalidExp.errors.some(e => e.includes("Invalid experience level")));
});

test("Preference score calculation: awards full points for matching role array and location", () => {
  const preferences = {
    roles: ["Full Stack", "Frontend", "Software Engineer"],
    locations: ["Colombo", "Remote"],
    jobTypes: ["Full Time"],
    mode: "hybrid"
  };

  const matchingJob = {
    title: "Senior Full Stack Engineer",
    location: "Colombo, Sri Lanka",
    jobType: "Full Time",
    mode: "hybrid"
  };

  const score = calculatePreferenceScore(preferences, matchingJob);
  // Full role match (40) + full mode/type match (30) + full location match (30) = 100
  assert.strictEqual(score, 100);
});

test("Preference score calculation: computes partial score when location or role deviates", () => {
  const preferences = {
    roles: ["QA", "DevOps"],
    locations: ["Kandy"],
    jobTypes: ["Full Time"],
    mode: "remote"
  };

  const nonMatchingJob = {
    title: "Java Backend Developer",
    location: "Singapore",
    jobType: "Full Time",
    mode: "on-site"
  };

  const score = calculatePreferenceScore(preferences, nonMatchingJob);
  assert.ok(score < 70, `Score (${score}) should be penalized for role, mode, and location deviation`);
});
