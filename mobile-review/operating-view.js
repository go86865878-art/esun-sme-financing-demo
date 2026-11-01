import {calculateOperating} from './operating-plan.js?v=roundcharts20261101b';
// Reconstruct charts for legacy snapshots without rewriting the submitted record.
export function operatingForDisplay(plan){
 const stored=plan?.out?.extra?.operating;if(!stored)return null;
 if(stored.forecast)return stored;
 try{return calculateOperating(plan.inputs).extra.operating;}catch{return null;}
}
