export const dynamic='force-dynamic';
const disabled=()=>Response.json({error:'local_only',message:'進度僅儲存在此裝置'}, {status:410,headers:{'Cache-Control':'no-store'}});
export const GET=disabled;
export const POST=disabled;
