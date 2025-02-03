import React, { useState } from 'react';

const API_KEY = 'fa-zGT0dlHDP2eI-gZiKAbJmESCDDDGquJUHdCzZ'; // Your API key
const API_URL = 'https://api.fashn.ai/v1/run'; // The API endpoint from the documentation
const STATUS_URL = 'https://api.fashn.ai/v1/status'; // Add this new endpoint

//Adding this comment to test the code

const App = () => {
  const [modelImage, setModelImage] = useState(null);
  const [garmentImage, setGarmentImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleModelUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setModelImage(URL.createObjectURL(file));
    }
  };

  const handleGarmentUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setGarmentImage(URL.createObjectURL(file));
    }
  };

  const handleTryOn = async () => {
    setIsLoading(true);
    try {
      // Convert images to base64 with proper prefix
      const modelBase64 = await fetch(modelImage)
        .then(res => res.blob())
        .then(blob => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result);
            };
            reader.readAsDataURL(blob);
          });
        });

      const garmentBase64 = await fetch(garmentImage)
        .then(res => res.blob())
        .then(blob => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result);
            };
            reader.readAsDataURL(blob);
          });
        });

      // Initial API call to start the prediction
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model_image: modelBase64,
          garment_image: garmentBase64,
          category: "tops"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      const data = await response.json();
      const predictionId = data.id;
      console.log('Received prediction ID:', predictionId);

      // Poll for the result using the prediction ID
      let resultData;
      while (true) {
        const statusResponse = await fetch(`${STATUS_URL}/${predictionId}`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        resultData = await statusResponse.json();
        console.log('Status check:', resultData);
        
        if (resultData.status === 'completed') {
          console.log('Processing completed:', resultData);
          // Check if output exists and has at least one element
          if (resultData.output && resultData.output.length > 0) {
            setResultImage(resultData.output[0]); // Get the first element of the output array
            break;
          } else {
            throw new Error('No output image in response');
          }
        } else if (resultData.status === 'failed') {
          throw new Error('Processing failed');
        }
        
        // Wait 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle closing
  const handleClose = () => {
    // Send message to parent window
    window.parent.postMessage('closeExtension', '*');
  };

  return (
    <div style={{ 
      padding: '15px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'  // Added for close button positioning
    }}>
      {/* Close Button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '5px',
          lineHeight: '1',
          zIndex: 1000
        }}
      >
        ×
      </button>

      <h1 style={{ 
        fontSize: '20px',
        marginBottom: '15px',
        color: 'white'
      }}>Virtual Try-On</h1>

      {/* Try-On Preview Box */}
      <div style={{ 
        border: '2px solid #444',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isLoading ? (
          <div style={{ color: '#ccc' }}>Processing...</div>
        ) : resultImage ? (
          <img 
            src={resultImage}
            alt="Try-on result"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <div style={{ color: '#ccc', fontSize: '16px' }}>
            Try-On Preview
          </div>
        )}
      </div>

      {/* Preview Areas Container */}
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        marginBottom: '15px',
        justifyContent: 'center'
      }}>
        {/* Model Preview */}
        <div style={{ 
          border: '2px solid #444',
          borderRadius: '8px',
          padding: '15px',
          width: '150px',
          textAlign: 'center'
        }}>
          {modelImage ? (
            <img 
              src={modelImage} 
              alt="Model preview" 
              style={{ 
                width: '150px', 
                height: '150px', 
                objectFit: 'cover',
                borderRadius: '4px'
              }} 
            />
          ) : (
            <div style={{ 
              color: '#ccc',
              fontSize: '14px',
              height: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              Model preview
            </div>
          )}
        </div>

        {/* Garment Preview */}
        <div style={{ 
          border: '2px solid #444',
          borderRadius: '8px',
          padding: '15px',
          width: '150px',
          textAlign: 'center'
        }}>
          {garmentImage ? (
            <img 
              src={garmentImage} 
              alt="Garment preview" 
              style={{ 
                width: '150px', 
                height: '150px', 
                objectFit: 'cover',
                borderRadius: '4px'
              }} 
            />
          ) : (
            <div style={{ 
              color: '#ccc',
              fontSize: '14px',
              height: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              Garment preview
            </div>
          )}
        </div>
      </div>

      {/* Upload Buttons Container */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        marginBottom: '15px',
        justifyContent: 'center'
      }}>
        {/* Model Upload Button */}
        <div>
          <input
            type="file"
            id="modelInput"
            accept="image/*"
            onChange={handleModelUpload}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="modelInput"
            style={{
              padding: '8px 16px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            Upload Model Photo
          </label>
        </div>

        {/* Garment Upload Button */}
        <div>
          <input
            type="file"
            id="garmentInput"
            accept="image/*"
            onChange={handleGarmentUpload}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="garmentInput"
            style={{
              padding: '8px 16px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            Upload Garment Photo
          </label>
        </div>
      </div>

      {/* Try It On Button */}
      <button 
        style={{
          padding: '8px 16px',
          backgroundColor: modelImage && garmentImage ? '#4CAF50' : '#666',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: modelImage && garmentImage ? 'pointer' : 'not-allowed',
          marginTop: '15px',
          width: '100%'
        }}
        onClick={handleTryOn}
        disabled={!modelImage || !garmentImage || isLoading}
      >
        {isLoading ? 'Processing...' : 'Try It On'}
      </button>
    </div>
  );
};

export default App;