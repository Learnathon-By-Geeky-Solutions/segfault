import React from 'react';
import Signup from "@/app/auth/signup/signup";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: 'Sign Up',
    description: 'Sign up for a new account on Codesirius',
}

const Page = () => {
    return (
        <div>
            <Signup/>
        </div>
    );
};

export default Page;
