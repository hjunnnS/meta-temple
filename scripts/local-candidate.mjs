const integrated=process.env.SASA_LOCAL_INTEGRATION==='1';
export const origin=integrated?'http://127.0.0.1:4341':'http://127.0.0.1:4340';
export const mailbox=integrated?'.m3-local/qa/mail':'.m3-local/mail';
