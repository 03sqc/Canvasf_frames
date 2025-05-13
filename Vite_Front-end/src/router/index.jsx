import { Navigate } from 'react-router-dom';
import Listone from "../component/list1";
import Index from "../component/Sqc_index";
import Indexone from "../component/indexone";
const router= [
    { path:'/index', element:<Index/>}, 
    { path:'/listone', element:<Listone/>}, 
    { path:'/indexone', element:<Indexone/> },
    { path: '/', element: <Navigate to="/list" /> }]

export default router;