// Metres in the scene: front of the hall is north (+Z). Each place reserves
// more depth than the seated mesh so visitors can also bow toward the altar.
export const bowSpace={width:1.05,depth:1.85};
export const hallSeats=Array.from({length:50},(_,i)=>({
 x:(i%10<5?-1:1)*(2.1+(i%5)*1.95),z:32.2+Math.floor(i/10)*2.05,
}));
