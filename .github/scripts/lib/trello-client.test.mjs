import assert from 'node:assert/strict'
import { test } from 'node:test'
import { commentOnce, updateBoardDescription } from './trello-client.mjs'

function fakeTrello(existingComments) {
  const calls = []
  const trello = async (path, init) => {
    calls.push({ path, init })
    if (path.endsWith('actions?filter=commentCard')) return existingComments
    return {}
  }
  trello.calls = calls
  return trello
}

test('posts a comment when none matches yet', async () => {
  const trello = fakeTrello([])
  const posted = await commentOnce(trello, 'card1', 'hello')
  assert.equal(posted, true)
  assert.equal(trello.calls.length, 2)
  assert.match(trello.calls[1].path, /actions\/comments\?text=hello/)
  assert.equal(trello.calls[1].init.method, 'POST')
})

test('skips posting when an identical comment already exists', async () => {
  const trello = fakeTrello([{ data: { text: 'hello' } }])
  const posted = await commentOnce(trello, 'card1', 'hello')
  assert.equal(posted, false)
  assert.equal(trello.calls.length, 1)
})

test('still posts when only a different comment exists', async () => {
  const trello = fakeTrello([{ data: { text: 'something else' } }])
  const posted = await commentOnce(trello, 'card1', 'hello')
  assert.equal(posted, true)
})

test('updateBoardDescription PUTs the desc to the board', async () => {
  const calls = []
  const trello = async (path, init) => {
    calls.push({ path, init })
    return {}
  }
  await updateBoardDescription(trello, 'board1', 'new description')
  assert.equal(calls.length, 1)
  assert.match(calls[0].path, /^\/boards\/board1\?desc=new\+description$/)
  assert.equal(calls[0].init.method, 'PUT')
})
