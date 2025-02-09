import {themeType} from "@/types";
import {User} from "@/lib/features/api/types";

export interface CodesiriusState {
    theme: themeType,
    isCodesiriusLoading: boolean,
    progress: number,
    user: User | null
}
