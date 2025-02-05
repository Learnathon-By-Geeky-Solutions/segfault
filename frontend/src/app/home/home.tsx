"use client";
import React, {useEffect} from 'react';
import {useAppDispatch, useAppSelector} from "@/lib/store/hooks";
import {AppDispatch} from "@/lib/store/store";
import {setCodesiriusLoading} from "@/lib/store/codesiriusSlice";

const Home = () => {
    const dispatch = useAppDispatch<AppDispatch>();
    const user = useAppSelector(state => state.codesirius.user);
    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);

    return (
        <div>
           Welcome {user?.firstName}
        </div>
    );
};

export default Home;