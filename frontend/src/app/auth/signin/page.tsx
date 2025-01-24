import React from 'react';
import Signin from "@/app/auth/signin/signin";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your account on Codesirius',
}

const Page = () => {
    return (
        <div>
            <Signin/>
        </div>
    );
};

export default Page;
