"use client"
import {useEffect} from 'react';
import {useAppDispatch} from "@/lib/hooks/hooks";
import {setDescription, setTitle} from "@/lib/features/codesirius/addProblemSlice";

interface DispatcherProps {
    title?: string;
    description?: string;
}

const Dispatcher = ({title, description}:DispatcherProps) => {
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(setTitle(title ?? ""));
        dispatch(setDescription(description ?? ""));
    }, []);
    return <></>;
};

export default Dispatcher;