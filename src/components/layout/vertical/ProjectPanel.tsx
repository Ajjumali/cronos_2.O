"use client";

import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { styled } from '@mui/material/styles';
import ListSubheader from '@mui/material/ListSubheader';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import {
  List,
  ListItem,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FolderIcon from '@mui/icons-material/Folder';
import { useEffect, useState, ChangeEvent } from 'react';

// Define types
interface SiteItem {
  studyNo: string | null;
  siteName: string | null;
}

interface ProjectStudyItem {
  studyNo: string | null;
  shortTitle: string;
  isEnabled: boolean;
  rowNo: number;
  sites: SiteItem[];
}

const StyledSwipeableDrawer = styled(SwipeableDrawer)(() => ({
  '& .MuiDrawer-paper': {
    width: 400,
  },
}));

function ProjectPanel() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectStudyItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudy, setSelectedStudy] = useState<string>('');
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/apps/lims/project-panel');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.result || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStudyChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const studyId = event.target.value;
    setSelectedStudy(studyId);
    const parentStudy = projects.find((study: ProjectStudyItem) => study.studyNo === studyId);
    if (parentStudy?.sites?.length) {
      setExpandedStudy(studyId); 
    }

    // TODO: Implement AddStudyAsPerUserSet API call
    try {
      const response = await fetch('/api/apps/lims/project-panel/set-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studyId }),
      });
      if (!response.ok) {
        throw new Error('Failed to set study');
      }
    } catch (error) {
      console.error('Error setting study:', error);
    }
  };

  const handleSiteChange = (event: ChangeEvent<HTMLInputElement>, parentStudyId: string) => {
    setSelectedStudy(event.target.value);
    setExpandedStudy(parentStudyId); 
  };

  const toggleExpand = (studyId: string) => {
    setExpandedStudy((prev) => (prev === studyId ? null : studyId));
  };

  const filteredProjects = projects.filter((study: ProjectStudyItem) =>
    study.shortTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Tooltip title="Projects">
        <IconButton onClick={() => setOpen(true)}>
          <FolderIcon />
        </IconButton>
      </Tooltip>
      <StyledSwipeableDrawer
        open={open}
        anchor="right"
        onOpen={() => {}}
        onClose={() => setOpen(false)}
        disableSwipeToOpen
      >
        <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
          <ListSubheader component="div">
            Projects
            <Tooltip title="Refresh">
              <IconButton onClick={fetchProjects}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </ListSubheader>
          <Divider />

          {isLoading && (
            <CircularProgress sx={{ display: 'block', margin: '16px auto' }} />
          )}

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search project"
            value={search}
            onChange={handleSearchChange}
            sx={{ margin: '10px' }}
          />

          <RadioGroup value={selectedStudy} onChange={handleStudyChange}>
            {filteredProjects.map((study: ProjectStudyItem) => (
              <div key={study.studyNo}>
                {/* Parent Project */}
                <ListItem component="div" sx={{ cursor: 'pointer' }}>
                  <FormControlLabel
                    value={study.studyNo}
                    control={<Radio disabled={!study.isEnabled} />}
                    label={<strong>{study.shortTitle}</strong>}
                  />
                  {study.sites?.length > 0 && (
                    <IconButton onClick={() => toggleExpand(study.studyNo || '')}>
                      {expandedStudy === study.studyNo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </ListItem>

                {expandedStudy === study.studyNo && study.sites?.length > 0 && (
                  <>
                    <ListSubheader sx={{ pl: 4, color: 'gray', fontSize: '12px', fontWeight: 'bold' }}>
                      Project/Group
                    </ListSubheader>
                    
                    <List sx={{ paddingLeft: '20px' }}>
                      {study.sites.map((site: SiteItem) => (
                        <ListItem
                          key={site.studyNo}
                          component="div"
                          sx={{
                            pl: 4, 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '8px',
                            marginY: 0.5,
                            cursor: 'pointer'
                          }}
                        >
                          <FormControlLabel
                            value={site.studyNo}
                            control={<Radio />}
                            label={
                              <span style={{ fontSize: '14px', color: '#333' }}>{site.siteName}</span>
                            }
                            onChange={(_, checked) => {
                              if (checked) {
                                handleSiteChange({ target: { value: site.studyNo || '' } } as React.ChangeEvent<HTMLInputElement>, study.studyNo || '');
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </div>
            ))}
          </RadioGroup>
        </PerfectScrollbar>
      </StyledSwipeableDrawer>
    </>
  );
}

export default ProjectPanel;

