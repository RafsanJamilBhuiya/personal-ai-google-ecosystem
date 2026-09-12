import { createTask, createTaskResult, updateTask } from "../database/task-store.js";
export class ExecutionEngine {
  constructor({toolRegistry={},maxRetries=2,timeoutMs=30000}={}){this.toolRegistry=toolRegistry;this.maxRetries=maxRetries;this.timeoutMs=timeoutMs;}
  async execute(env,task){
    const started=new Date().toISOString(); await updateTask(env,task.task_id,{status:"running",started_at:started,error:""});
    let lastError=null;
    for(let attempt=0;attempt<=this.maxRetries;attempt++){
      try{
        const tool=this.toolRegistry[task.tool]; if(typeof tool!=="function") throw new Error("TOOL_NOT_REGISTERED");
        const result=await Promise.race([tool(env,task.input||{}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("EXECUTION_TIMEOUT")),this.timeoutMs))]);
        const resultRecord=await createTaskResult(env,{task_id:task.task_id,status:"success",response:result?.response??"",data:JSON.stringify(result?.data??result??{}),execution_time:String(Date.now()-Date.parse(started))});
        await updateTask(env,task.task_id,{status:"completed",completed_at:new Date().toISOString(),result_id:resultRecord?.spreadsheetId||resultRecord?.result_id||""});
        return {status:"completed",result};
      }catch(error){lastError=error;if(attempt<this.maxRetries) await new Promise(r=>setTimeout(r,250*(2**attempt)));}
    }
    await createTaskResult(env,{task_id:task.task_id,status:"failed",response:"Execution failed",data:"",execution_time:String(Date.now()-Date.parse(started))});
    await updateTask(env,task.task_id,{status:"failed",completed_at:new Date().toISOString(),error:String(lastError?.message||lastError)});
    throw lastError;
  }
}
export async function persistTask(env,task){return createTask(env,{...task,status:"queued"});}
