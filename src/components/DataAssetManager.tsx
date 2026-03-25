import React, { useState, useRef, useEffect } from 'react';
import { DataAsset, DataPoint, ChartConfig } from '../types/timeline';
import { Card, Button, Form, Input, Select, Dialog, Upload, Icon, Slider, Switch } from 'element-ui';

interface DataAssetManagerProps {
  dataAssets: DataAsset[];
  onCreateDataAsset: (asset: Omit<DataAsset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDataAsset: (assetId: string, updates: Partial<DataAsset>) => void;
  onDeleteDataAsset: (assetId: string) => void;
}

const DataAssetManager: React.FC<DataAssetManagerProps> = ({
  dataAssets,
  onCreateDataAsset,
  onUpdateDataAsset,
  onDeleteDataAsset
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    description: '',
    type: 'chart' as const,
    data: [] as DataPoint[],
    chartConfig: {
      chartType: 'line' as const,
      color: '#409eff',
      smoothing: false,
      showGrid: true,
      showLegend: true,
      yAxisLabel: '',
      xAxisLabel: ''
    }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCreateDataAsset = () => {
    if (!newAssetForm.name.trim()) {
      alert('Please enter a data asset name');
      return;
    }

    if (newAssetForm.data.length === 0) {
      alert('Please add some data points');
      return;
    }

    onCreateDataAsset(newAssetForm);
    setNewAssetForm({
      name: '',
      description: '',
      type: 'chart',
      data: [],
      chartConfig: {
        chartType: 'line',
        color: '#409eff',
        smoothing: false,
        showGrid: true,
        showLegend: true,
        yAxisLabel: '',
        xAxisLabel: ''
      }
    });
    setShowCreateDialog(false);
  };

  const handleDataUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const data: DataPoint[] = lines.map((line, index) => {
          const [timestamp, value, label] = line.split(',').map(s => s.trim());
          return {
            timestamp: parseFloat(timestamp) || Date.now() + index * 1000,
            value: parseFloat(value) || 0,
            label: label || `Point ${index + 1}`
          };
        }).filter(point => !isNaN(point.timestamp) && !isNaN(point.value));

        setNewAssetForm({ ...newAssetForm, data });
      } catch (error) {
        alert('Failed to parse data file. Please ensure it is in CSV format: timestamp,value,label');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const addDataPoint = () => {
    const newPoint: DataPoint = {
      timestamp: Date.now(),
      value: 0,
      label: `Point ${newAssetForm.data.length + 1}`
    };
    setNewAssetForm({
      ...newAssetForm,
      data: [...newAssetForm.data, newPoint]
    });
  };

  const updateDataPoint = (index: number, field: keyof DataPoint, value: any) => {
    const updatedData = [...newAssetForm.data];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setNewAssetForm({ ...newAssetForm, data: updatedData });
  };

  const removeDataPoint = (index: number) => {
    setNewAssetForm({
      ...newAssetForm,
      data: newAssetForm.data.filter((_, i) => i !== index)
    });
  };

  const drawChart = (asset: DataAsset) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    if (asset.data.length === 0) return;

    // Calculate bounds
    const timestamps = asset.data.map(d => d.timestamp);
    const values = asset.data.map(d => d.value);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Draw grid
    if (asset.chartConfig.showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (height - 2 * padding) * i / 5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let i = 0; i <= 5; i++) {
        const x = padding + (width - 2 * padding) * i / 5;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }
    }

    // Draw chart based on type
    ctx.strokeStyle = asset.chartConfig.color;
    ctx.fillStyle = asset.chartConfig.color;
    ctx.lineWidth = 2;

    const xScale = (timestamp: number) => 
      padding + ((timestamp - minTime) / (maxTime - minTime)) * (width - 2 * padding);
    const yScale = (value: number) => 
      height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding);

    if (asset.chartConfig.chartType === 'line') {
      // Draw line chart
      ctx.beginPath();
      asset.data.forEach((point, index) => {
        const x = xScale(point.timestamp);
        const y = yScale(point.value);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      asset.data.forEach(point => {
        const x = xScale(point.timestamp);
        const y = yScale(point.value);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else if (asset.chartConfig.chartType === 'bar') {
      // Draw bar chart
      const barWidth = (width - 2 * padding) / asset.data.length * 0.8;
      asset.data.forEach((point, index) => {
        const x = padding + (index * (width - 2 * padding) / asset.data.length) + barWidth * 0.1;
        const barHeight = (point.value - minValue) / (maxValue - minValue) * (height - 2 * padding);
        const y = height - padding - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels
    asset.data.forEach((point, index) => {
      if (index % Math.ceil(asset.data.length / 5) === 0) {
        const x = xScale(point.timestamp);
        ctx.fillText(new Date(point.timestamp).toLocaleDateString(), x, height - padding + 20);
      }
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (maxValue - minValue) * (1 - i / 5);
      const y = padding + (height - 2 * padding) * i / 5;
      ctx.fillText(value.toFixed(2), padding - 10, y + 4);
    }
  };

  useEffect(() => {
    if (selectedAsset && showChartDialog) {
      drawChart(selectedAsset);
    }
  }, [selectedAsset, showChartDialog]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Data Asset Manager</h2>
        <Button type="primary" onClick={() => setShowCreateDialog(true)}>
          New Data Asset
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {dataAssets.map((asset) => (
          <Card
            key={asset.id}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedAsset(asset);
              setShowChartDialog(true);
            }}
          >
            <h3>{asset.name}</h3>
            {asset.description && <p style={{ color: '#666', fontSize: '14px' }}>{asset.description}</p>}
            
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#999' }}>
                <span>Type: {asset.type}</span>
                <span>Data Points: {asset.data.length}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                Created: {new Date(asset.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <Button
                size="small"
                type="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete data asset "${asset.name}"?`)) {
                    onDeleteDataAsset(asset.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        title="Create New Data Asset"
        visible={showCreateDialog}
        onCancel={() => setShowCreateDialog(false)}
        onConfirm={handleCreateDataAsset}
        width="800px"
      >
        <Form labelWidth="120px">
          <Form.Item label="Asset Name" required>
            <Input
              value={newAssetForm.name}
              onChange={(value) => setNewAssetForm({ ...newAssetForm, name: value })}
              placeholder="Enter data asset name"
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input
              type="textarea"
              value={newAssetForm.description}
              onChange={(value) => setNewAssetForm({ ...newAssetForm, description: value })}
              placeholder="Enter data asset description"
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Data Type">
            <Select
              value={newAssetForm.type}
              onChange={(value) => setNewAssetForm({ ...newAssetForm, type: value as any })}
            >
              <Select.Option label="Chart" value="chart" />
              <Select.Option label="Economic" value="economic" />
              <Select.Option label="Stock" value="stock" />
              <Select.Option label="Custom" value="custom" />
            </Select>
          </Form.Item>
          <Form.Item label="Chart Type">
            <Select
              value={newAssetForm.chartConfig.chartType}
              onChange={(value) => setNewAssetForm({
                ...newAssetForm,
                chartConfig: { ...newAssetForm.chartConfig, chartType: value as any }
              })}
            >
              <Select.Option label="Line" value="line" />
              <Select.Option label="Bar" value="bar" />
              <Select.Option label="Area" value="area" />
              <Select.Option label="Candlestick" value="candlestick" />
            </Select>
          </Form.Item>
          <Form.Item label="Data Upload">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Upload
                beforeUpload={handleDataUpload}
                showFileList={false}
                accept=".csv,.txt"
              >
                <Button size="small">
                  <Icon name="upload" /> Upload CSV
                </Button>
              </Upload>
              <Button size="small" type="primary" onClick={addDataPoint}>
                Add Point
              </Button>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              CSV format: timestamp,value,label
            </div>
          </Form.Item>
          <Form.Item label="Data Points">
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
              {newAssetForm.data.map((point, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  <Input
                    size="small"
                    value={point.timestamp.toString()}
                    onChange={(value) => updateDataPoint(index, 'timestamp', parseFloat(value) || 0)}
                    placeholder="Timestamp"
                    style={{ width: '120px' }}
                  />
                  <Input
                    size="small"
                    value={point.value.toString()}
                    onChange={(value) => updateDataPoint(index, 'value', parseFloat(value) || 0)}
                    placeholder="Value"
                    style={{ width: '100px' }}
                  />
                  <Input
                    size="small"
                    value={point.label}
                    onChange={(value) => updateDataPoint(index, 'label', value)}
                    placeholder="Label"
                    style={{ width: '150px' }}
                  />
                  <Button
                    size="small"
                    type="danger"
                    onClick={() => removeDataPoint(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {newAssetForm.data.length === 0 && <div style={{ color: '#999', textAlign: 'center' }}>No data points yet</div>}
            </div>
          </Form.Item>
        </Form>
      </Dialog>

      <Dialog
        title={`Data Asset: ${selectedAsset?.name}`}
        visible={showChartDialog}
        onCancel={() => setShowChartDialog(false)}
        onConfirm={() => setShowChartDialog(false)}
        width="900px"
      >
        {selectedAsset && (
          <div>
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              style={{ border: '1px solid #ddd', width: '100%' }}
            />
            <div style={{ marginTop: '20px' }}>
              <h4>Data Points ({selectedAsset.data.length})</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                {selectedAsset.data.map((point, index) => (
                  <div key={index} style={{ fontSize: '12px', marginBottom: '5px' }}>
                    {new Date(point.timestamp).toLocaleString()}: {point.value} {point.label && `- ${point.label}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default DataAssetManager;
