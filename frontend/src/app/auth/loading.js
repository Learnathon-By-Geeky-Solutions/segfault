import React from 'react'
import { Paper, Skeleton } from '@mui/material'
import Divider from '@mui/material/Divider'
import { Grid } from '@mui/system'

const Loading = () => {
  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
      <Grid size={{ xs: 12, md: 5, lg: 4, xl: 3 }}>
        <Paper elevation={4} component="form"
               sx={{ padding: 2, display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }} noValidate
               autoComplete="off">
          <Skeleton variant="text" width="100%"/>
          <Divider/>
          <Skeleton variant="text" width="100%"/>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default Loading
