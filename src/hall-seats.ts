// Metres in the scene: front of the hall is north (+Z). Each place reserves
// more depth than the seated mesh so visitors can also bow toward the altar.
export const bowSpace={width:1.05,depth:1.85};
// The monk sits just altar-side of the front row, aligned with the left inner cushion.
export const monkPlace={x:-2.1,z:41};
const layout=Array.from({length:50},(_,i)=>({
 x:(i%10<5?-1:1)*(2.1+(i%5)*1.95),z:32.2+Math.floor(i/10)*2.05,
}));

// Inner cushion beside the aisle, reserved for the walking visitor.
export const practiceSeat=layout[35];
export const hallSeats=layout.filter((_,index)=>index!==40);
