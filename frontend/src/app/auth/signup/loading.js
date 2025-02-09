'use client'
import React from 'react'
import { Grid } from '@mui/system'
import Typography from '@mui/material/Typography'
import { Paper, Skeleton } from '@mui/material'
import Divider from '@mui/material/Divider'

const Loading = () => {
  // Loading screen for the signup page
  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
      <Grid size={{ xs: 12, md: 5, lg: 4, xl: 3 }}>
        <Paper elevation={4}
               sx={{ padding: 2, display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
          <Typography variant="h4" align="center">Signup</Typography>
          <Skeleton variant="rectangular" height={30}/>
          <Skeleton variant="rectangular" height={30}/>
          <Skeleton variant="rectangular" height={30}/>
          <Skeleton variant="rectangular" height={30}/>
          <Skeleton variant="rectangular" height={30}/>
          <Skeleton variant="rectangular" height={30}/>
          <Divider/>
          <Skeleton variant="rectangular" height={30}/>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default Loading
