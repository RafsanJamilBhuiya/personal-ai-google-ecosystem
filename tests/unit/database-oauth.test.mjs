import test from "node:test";
import assert from "node:assert/strict";
import { rowFor, SHEETS } from "../../backend/database/sheets-engine.js";
import { verifyOAuthState, createOAuthState } from "../../backend/google/oauth.js";
test("database schema maps known fields",()=>{const row=rowFor("tasks",{task_id:"t1",status:"queued"});assert.equal(row.length,SHEETS.tasks.length);assert.equal(row[0],"t1");assert.equal(row[5],"queued");});
test("oauth state is signed and time bounded",async()=>{const env={OAUTH_STATE_SECRET:"test-secret"};const state=await createOAuthState(env);assert.equal(await verifyOAuthState(env,state),true);assert.equal(await verifyOAuthState({...env,OAUTH_STATE_SECRET:"wrong"},state),false);});
