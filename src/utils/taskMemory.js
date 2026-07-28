/**
 * taskMemory.js — compatibility shim
 *
 * Maps the old task API to the new updateMemory.js functions.
 * Files.jsx and Projects.jsx use this until they are migrated to updateMemory.
 */

import {
  getUpdates,
  createUpdate,
  updateUpdate,
  deleteUpdate,
  getActiveUpdate,
  getUpdateById,
} from './updateMemory'

export function getTasks(owner, repo) {
  return getUpdates(owner, repo)
}

export function createTask(owner, repo, title, goal = null) {
  return createUpdate(owner, repo, title, goal)
}

export function updateTask(owner, repo, id, patch) {
  return updateUpdate(owner, repo, id, patch)
}

export function deleteTask(owner, repo, id) {
  return deleteUpdate(owner, repo, id)
}

export function getActiveTask(owner, repo) {
  return getActiveUpdate(owner, repo)
}

export function getTaskById(owner, repo, id) {
  return getUpdateById(owner, repo, id)
}
