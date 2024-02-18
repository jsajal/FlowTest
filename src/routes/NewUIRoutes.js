import React from 'react';
import { Outlet } from 'react-router';
import NewUIHome from '../newUserInterface/components/pages/NewUIHome';

const NewUIRoutes = {
  path: '/',
  element: <Outlet />,
  children: [
    {
      path: '/home',
      element: <NewUIHome />,
    },
  ],
};

export default NewUIRoutes;
