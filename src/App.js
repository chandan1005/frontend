import React, { useState, useEffect } from 'react';
import { Button, Container, Typography, CircularProgress, Tabs, Tab, Box, Select, MenuItem, FormControl, InputLabel, Grid, Paper, AppBar, Toolbar } from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import io from 'socket.io-client';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { FaNetworkWired, FaDownload, FaLock, FaChartLine, FaCogs, FaTasks, FaFileAlt } from 'react-icons/fa';
import './App.css';
// Register the necessary Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

//const socket = io('http://localhost:5000');
const socket=io('http://172.31.196.81:5000');

const theme = createTheme({
  palette: {
    primary: {
      main: '#0d47a1',
    },
    secondary: {
      main: '#b71c1c',
    },
  },
  typography: {
    h4: {
      fontWeight:'lighter',
      color: '#fff',
    },
    h6: {
      fontWeight: '500',
      color:'lightblue',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '20px',
          marginTop: '20px',
          borderRadius: '8px',
          color:'black',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'lightyellow',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor:'lightblue',
          color: '#fff',
          marginBottom: '20px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
          fontSize: '16px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          color:'purple',
          backgroundColor: 'lightgreen',
          marginBottom: '20px',
        },
      },
    },
  },
});
const App = () => {
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState({
    labels: [],
    datasets: [{
      label: 'Packet Statistics',
      data: [],
      backgroundColor: ['#66b2ff', '#ff7043', '#ffd9b3']
    }]
  });
  const [mitmDetails, setMitmDetails] = useState([]);
  const [packets, setPackets] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [attackStats, setAttackStats] = useState({
    mitm_packets: 0,
    spoofing_packets: 0,
    dns_spoofing_packets: 0,
    https_spoofing_packets: 0,
    total_packets: 0
  });
  const [analysisData, setAnalysisData] = useState([]);
  const [attackType, setAttackType] = useState('mitm_attacks');
  const [logs, setLogs] = useState('');
  const [role, setRole] = useState('viewer');  // Default role is viewer

  useEffect(() => {
    socket.on('packet_data', (data) => {
      setPackets((prevPackets) => [...prevPackets, data]);
      updateGraph(data);
    });

    return () => {
      socket.off('packet_data');
    };
  }, []);

  const startCapture = async () => {
    try {
      setLoading(true);
      setCapturing(true);
      await axios.post('http://localhost:5000/start_capture', { duration: 60 });
      setLoading(false);
    } catch (error) {
      console.error('Error starting packet capture:', error);
      alert('Failed to start packet capture. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  const stopCapture = async () => {
    try {
      setCapturing(false);
      await axios.post('http://localhost:5000/stop_capture');
    } catch (error) {
      console.error('Error stopping packet capture:', error);
    }
  };

  const updateGraph = (data) => {
    setGraphData((prevState) => {
      const newLabels = [...prevState.labels, new Date().toLocaleTimeString()];
      const newDataset = [...prevState.datasets[0].data, data.total_packets];
      return {
        ...prevState,
        labels: newLabels,
        datasets: [{
          ...prevState.datasets[0],
          data: newDataset
        }]
      };
    });
  };

  const fetchAttackStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/network_attacks');
      setAttackStats(response.data);
    } catch (error) {
      console.error('Error fetching attack statistics:', error);
    }
  };

  const fetchAnalysisData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/analyze_attacks?type=${attackType}`);
      setAnalysisData(response.data);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      setAnalysisData([]);  // Ensure it is an array on error
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/logs');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const downloadReport = () => {
    const csvContent = [
      ["Source", "Destination", "Details"],
      ...mitmDetails.map(detail => [detail.ip_src, detail.ip_dst, detail.details])
    ]
    .map(e => e.join(","))
    .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'MITM_Report.csv');
    link.click();
  };

  const downloadCapturedPackets = () => {
    window.location.href = 'http://localhost:5000/download_packets';
  };

  const fetchThreatIntelligence = async () => {
    try {
      const response = await axios.get('http://localhost:5000/fetch_threat_intelligence');
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching threat intelligence:', error);
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 3) {
      fetchAttackStats();
    } else if (newValue === 4) {
      fetchAnalysisData();
    } else if (newValue === 5) {
      fetchLogs();
    }
  };

  const handleChangeAttackType = (event) => {
    setAttackType(event.target.value);
    fetchAnalysisData();
  };

  const handleRoleChange = (event) => {
    setRole(event.target.value);
  };

  const calculatePercentage = (part, total) => {
    return total === 0 ? 0 : ((part / total) * 100).toFixed(2);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Typography variant="h4" gutterBottom>Network Monitor - {role.toUpperCase()}</Typography>
        <FormControl variant="outlined" fullWidth style={{ marginBottom: '20px' }}>
          <InputLabel>Role</InputLabel>
          <Select value={role} onChange={handleRoleChange} label="Role">
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </Select>
        </FormControl>
        <Tabs value={tabValue} onChange={handleChangeTab} centered>
          <Tab icon={<FaNetworkWired />} label="Capture" />
          <Tab icon={<FaChartLine />} label="Graph" />
          <Tab icon={<FaDownload />} label="Download" />
          <Tab icon={<FaLock />} label="Network Attacks" />
          <Tab icon={<FaTasks />} label="Attack Analysis" />
          <Tab icon={<FaFileAlt />} label="Logs" />
          {role === 'admin' && <Tab icon={<FaCogs />} label="Admin Tools" />}
        </Tabs>
        {tabValue === 0 && (
          <Grid container spacing={2}>
            <Grid item>
              <Button className="capture-button" variant="contained" onClick={startCapture} disabled={loading || capturing}>
                {loading ? <CircularProgress size={24} /> : 'Start Packet Capture'}
              </Button>
            </Grid>
            <Grid item>
              <Button className="capture-button" variant="contained" onClick={stopCapture} disabled={!capturing}>
                Stop Packet Capture
              </Button>
            </Grid>
          </Grid>
        )}
        {tabValue === 1 && (
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <div className="chart-container">
              <Line data={graphData} />
            </div>
          </Paper>
        )}
        {tabValue === 2 && (
          <Grid container spacing={2}>
            <Grid item>
              <Button className="download-button" variant="contained" onClick={downloadReport}>
                Download MITM Report
              </Button>
            </Grid>
            <Grid item>
              <Button className="download-button" variant="contained" onClick={downloadCapturedPackets}>
                Download Captured Packets
              </Button>
            </Grid>
          </Grid>
        )}
        {tabValue === 3 && (
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h6">Network Attack Statistics</Typography>
            <Typography variant="body1">Total Packets: {attackStats.total_packets}</Typography>
            <Typography variant="body1">MITM Packets: {attackStats.mitm_packets} ({calculatePercentage(attackStats.mitm_packets, attackStats.total_packets)}%)</Typography>
            <Typography variant="body1">Spoofing Packets: {attackStats.spoofing_packets} ({calculatePercentage(attackStats.spoofing_packets, attackStats.total_packets)}%)</Typography>
            <Typography variant="body1">DNS Spoofing Packets: {attackStats.dns_spoofing_packets} ({calculatePercentage(attackStats.dns_spoofing_packets, attackStats.total_packets)}%)</Typography>
            <Typography variant="body1">HTTPS Spoofing Packets: {attackStats.https_spoofing_packets} ({calculatePercentage(attackStats.https_spoofing_packets, attackStats.total_packets)}%)</Typography>
          </Paper>
        )}
        {tabValue === 4 && (
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h6">Attack Analysis</Typography>
            <FormControl variant="outlined" fullWidth style={{ marginBottom: '20px' }}>
              <InputLabel>Attack Type</InputLabel>
              <Select value={attackType} onChange={handleChangeAttackType} label="Attack Type">
                <MenuItem value="mitm_attacks">MITM Attacks</MenuItem>
                <MenuItem value="spoofing_attacks">Spoofing Attacks</MenuItem>
                <MenuItem value="dns_spoofing_attacks">DNS Spoofing Attacks</MenuItem>
                <MenuItem value="https_spoofing_attacks">HTTPS Spoofing Attacks</MenuItem>
              </Select>
            </FormControl>
            <pre className="logs-pre">
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          </Paper>
        )}
        {tabValue === 5 && (
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h6">Logs</Typography>
            <pre className="logs-pre">
              {logs}
            </pre>
          </Paper>
        )}
        {role === 'admin' && tabValue === 6 && (
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h6">Admin Tools</Typography>
            <Button variant="contained" color="secondary" onClick={fetchThreatIntelligence}>
              Fetch Threat Intelligence
            </Button>
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
