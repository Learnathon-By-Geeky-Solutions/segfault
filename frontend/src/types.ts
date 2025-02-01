export type themeType = 'light' | 'dark'

export type codesiriusStateType = {
    currentTheme: themeType,
    setCurrentTheme: (theme: themeType) => void,
    isCodesiriusLoading: boolean,
    setCodesiriusLoading: (isLoading: boolean) => void
}