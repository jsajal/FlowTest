import * as React from 'react';

// mui
import { 
    Box, 
    TextField, 
    MenuItem, 
    Menu, 
    IconButton, 
    Divider, 
    Typography, 
    FormControl, 
    Button, 
    OutlinedInput, 
    InputAdornment, 
    FormHelperText 
} from "@mui/material"

import { grey } from "@mui/material/colors"

import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconUpload } from '@tabler/icons-react';

const requestBodyTypeOptions = [
    'None',
    'form-data',
    'raw-json',
    'raw-txt',
];

const ITEM_HEIGHT = 48;

const RequestBody = ({nodeData}) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [bodyType, setBodyType] = React.useState('None')
    const [myValue, setMyValue] = React.useState('')

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (option) => {
        nodeData["requestBody"] = {}
        nodeData.requestBody.type = option
        setBodyType(option)
        setMyValue('')
        setAnchorEl(null);
    };

    const handleFileUpload = async (e) => {
        if (!e.target.files) return

        if (e.target.files.length === 1) {
            const file = e.target.files[0]
            const { name } = file

            const reader = new FileReader()
            reader.onload = (evt) => {
                if (!evt?.target?.result) {
                    return
                }
                const { result } = evt.target

                const value = result

                setMyValue(name)
                if(!nodeData.requestBody.body) {
                    nodeData.requestBody.body = {}
                }
                nodeData.requestBody.body.value = value
            }
            reader.readAsDataURL(file)
        }
    }

    const handleFormDataKey = (e) => {
        if(!nodeData.requestBody.body) {
            nodeData.requestBody.body = {}
        }
        nodeData.requestBody.body.key = e.target.value
    }

    const handleRawJson = (e) => {
        nodeData.requestBody.body = e.target.value
    }

    return (
      <>
        <Divider />
        <Box sx={{ background: grey[100], p: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Typography
                    sx={{
                        fontWeight: 500,
                        textAlign: 'center'
                    }}
                >
                        Body 
                </Typography>
                <div>
                    <IconButton
                        aria-label="more"
                        id="long-button"
                        aria-controls={open ? 'long-menu' : undefined}
                        aria-expanded={open ? 'true' : undefined}
                        aria-haspopup="true"
                        onClick={handleClick}
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        id="long-menu"
                        MenuListProps={{
                        'aria-labelledby': 'long-button',
                        }}
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        PaperProps={{
                        style: {
                            maxHeight: ITEM_HEIGHT * 4.5,
                            width: '20ch',
                        },
                        }}
                    >
                        {requestBodyTypeOptions.map((bodyTypeOption) => (
                            <MenuItem key={bodyTypeOption} onClick={() => handleClose(bodyTypeOption)}>
                                {bodyTypeOption}
                            </MenuItem>
                        ))}
                    </Menu>
                </div>
            </div>
        </Box>
        <Divider />
        {bodyType === 'raw-json' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'left' }}>
                    <Box style={{ width: 300, margin: 10, padding: 5 }}>
                        <TextField
                            id="outlined-multiline-static"
                            label={bodyType}
                            multiline
                            rows={4}
                            defaultValue="{}"
                            fullWidth
                            className="nodrag"
                            onChange={(e) => handleRawJson(e)}
                        />
                    </Box>
                </div>
            )
        }
        {bodyType === 'form-data' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'left' }}>
                    <Box style={{ width: 300, margin: 10, padding: 5 }}>
                        <div>
                            <OutlinedInput
                                id="outlined-adornment-weight"
                                endAdornment={<InputAdornment position="end">File</InputAdornment>}
                                aria-describedby="outlined-weight-helper-text"
                                inputProps={{
                                'aria-label': 'weight',
                                }}
                                fullWidth
                                size="small"
                                className="nodrag"
                                onChange={(e) => handleFormDataKey(e)}
                            />
                            <FormHelperText id="outlined-weight-helper-text">Key</FormHelperText>
                        </div>
                        <FormControl sx={{ mt: 1, width: '100%' }} size='small'>
                            <span
                                style={{
                                    fontSize: '0.9rem',
                                    fontStyle: 'italic',
                                    color: grey[800],
                                    marginBottom: '1rem'
                                }}
                            >
                                {myValue != '' ? myValue : 'Choose a file to upload'}
                            </span>
                            <Button
                                variant='outlined'
                                component='label'
                                fullWidth
                                startIcon={<IconUpload/>}
                                sx={{ marginRight: '1rem' }}
                            >
                                {'Upload File'}
                                <input type='file' hidden onChange={(e) => handleFileUpload(e)} />
                            </Button>
                        </FormControl>
                    </Box>
                </div>
            )
        }
    </>
  );
}

export default RequestBody
