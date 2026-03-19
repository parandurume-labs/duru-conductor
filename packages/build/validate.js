#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

function extractField(frontmatter, fieldName) {
  // Multi-line folded scalar: "fieldName: >-" followed by indented lines
  // Must check this BEFORE inline to avoid matching ">-" as an inline value
  const foldedMatch = frontmatter.match(
    new RegExp(`^${fieldName}:\\s*>-?\\s*\\r?\\n(([ \\t]+.+\\r?\\n?)+)`, 'm')
  );
  if (foldedMatch) {
    return foldedMatch[1]
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');
  }

  // Single-line value: "fieldName: value"
  const inlineMatch = frontmatter.match(
    new RegExp(`^${fieldName}:\\s*(.+)$`, 'm')
  );
  if (inlineMatch) return inlineMatch[1].trim();

  return null;
}

function validate() {
  // Discover skill directories
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log('⚠️  No skills/ directory found. Nothing to validate.');
    process.exit(0);
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (skillDirs.length === 0) {
    console.log('⚠️  No skill directories found in skills/. Nothing to validate.');
    process.exit(0);
  }

  let hasErrors = false;

  for (const dirName of skillDirs) {
    const skillFile = path.join(SKILLS_DIR, dirName, 'SKILL.md');
    const label = `skills/${dirName}/SKILL.md`;

    // Check SKILL.md exists
    if (!fs.existsSync(skillFile)) {
      console.log(`❌ ${label} — file not found`);
      hasErrors = true;
      continue;
    }

    const content = fs.readFileSync(skillFile, 'utf-8');

    // Check frontmatter exists
    const frontmatter = extractFrontmatter(content);
    if (!frontmatter) {
      console.log(`❌ ${label} — missing YAML frontmatter (must start with ---)`);
      hasErrors = true;
      continue;
    }

    // Check name field
    const name = extractField(frontmatter, 'name');
    if (!name) {
      console.log(`❌ ${label} — missing "name" field in frontmatter`);
      hasErrors = true;
      continue;
    }

    // Check name matches folder
    if (name !== dirName) {
      console.log(`❌ ${label} — name "${name}" does not match folder "${dirName}"`);
      hasErrors = true;
    }

    // Check name format
    if (!NAME_PATTERN.test(name)) {
      console.log(`❌ ${label} — name "${name}" must be lowercase alphanumeric with hyphens (e.g., "my-skill")`);
      hasErrors = true;
    }

    // Check name length
    if (name.length > MAX_NAME_LENGTH) {
      console.log(`❌ ${label} — name exceeds ${MAX_NAME_LENGTH} characters (got ${name.length})`);
      hasErrors = true;
    }

    // Check description field
    const description = extractField(frontmatter, 'description');
    if (!description) {
      console.log(`❌ ${label} — missing "description" field in frontmatter`);
      hasErrors = true;
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      console.log(`❌ ${label} — description exceeds ${MAX_DESCRIPTION_LENGTH} characters (got ${description.length})`);
      hasErrors = true;
    }

    // If no errors for this skill, report success
    if (!hasErrors || (hasErrors && name === dirName && NAME_PATTERN.test(name) && description)) {
      console.log(`✅ ${label} — valid (name: "${name}", description: ${description.length} chars)`);
    }
  }

  console.log('');
  if (hasErrors) {
    console.log(`❌ Validation failed. Fix the errors above and try again.`);
    process.exit(1);
  } else {
    console.log(`✅ All ${skillDirs.length} skills valid.`);
  }
}

validate();
