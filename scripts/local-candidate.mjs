const integrated=process.env.SASA_LOCAL_INTEGRATION==='1';
export const origin=process.env.SASA_URL??(integrated?'http://127.0.0.1:4341':'http://127.0.0.1:4340');
export const mailbox=process.env.SASA_TEST_MAIL??(integrated?'.m3-local/qa/mail':'.m3-local/mail');
