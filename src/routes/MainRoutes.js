import HomeLayout from "../home";
import SavedFlows from "../home/SavedFlows";
import Collections from "../home/Collections";
import AuthKeys from "../home/AuthKeys";
import FlowTestAI from "../home/FlowTestAI";

const MainRoutes = ({socket}) => (
    {
        path: '/',
        element: <HomeLayout/>,
        children: [
            {
                path: '/flowtest',
                element: <SavedFlows socket={socket} />
            },
            {
                path: '/collection',
                element: <Collections />
            },
            {
                path: '/collection/:id',
                element: <Collections />
            },
            {
                path: '/authkeys',
                element: <AuthKeys />
            },
            {
                path: '/flowtest/ai',
                element: <FlowTestAI />
            }
        ] 
    }
)

export default MainRoutes;