import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { Input, Button } from 'antd';

export default function App() {
  const [image, setImage] = useState<HTMLImageElement>();
  const [offset, setOffset] = useState<{
    dx: number;
    dy: number;
  }>({
    dx: 0,
    dy: 0,
  });
  const [scale, setScale] = useState(1);

  const dragStart = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const onFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      throw new Error('Cannot find');
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    dragStart.current = {
      x: e.clientX - offset.dx,
      y: e.clientY - offset.dy,
    };
  };

  const onMouseUp = (_e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    dragStart.current = null;
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (dragStart.current) {
      setOffset({
        dx: e.clientX - dragStart.current.x,
        dy: e.clientY - dragStart.current.y,
      })
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const scaleRange = [0.1, 5];
    let newScale = scale + (e.deltaY < 0 ? 0.5 : (scale < 1.2 ? -0.2 : -0.5));
    if (newScale < scaleRange[0]) newScale = scaleRange[0];
    if (newScale > scaleRange[1]) newScale = scaleRange[1];

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const ratio = newScale / scale;
    const newDx = mouseX - ratio * (mouseX - offset.dx);
    const newDy = mouseY - ratio * (mouseY - offset.dy);

    setScale(newScale);
    setOffset({
      dx: newDx, 
      dy: newDy 
    });
  };

  const onNegativeFilm = () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Can not create canvas context')
    } else if (image) {
      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      const newData = new ImageData(new Uint8ClampedArray(data), imageData.width, imageData.height);
      ctx.putImageData(newData, 0, 0);
    }
  };
  
  useEffect(() => {
    if (!image) {
      return;
    }

    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Can not create canvas context')
    };

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ratio = image.height / image.width;
    ctx.drawImage(image, offset.dx, offset.dy, width * scale, height * ratio * scale);
    
  }, [image, offset, scale])
  
  return (
    <div style={{
      display: 'inline-flex',
      justifyContent: 'center',
      padding: 20
    }}>
      <Input type="file" accept="image/png, image/jpg, image/jpeg" onChange={onFileUpload}></Input>
      <canvas id="canvas" width={512} height={512} style={{
        border: '1px solid black',
        marginLeft: 20,
        marginRight: 20,
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}/>
      <Button onClick={onNegativeFilm}>负片</Button>
    </div>
  )
}