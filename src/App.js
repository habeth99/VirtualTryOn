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
  const [category, setCategory] = useState('tops'); // Default to tops

  const handleModelUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelImage({
          file: file,
          base64: reader.result,
          preview: URL.createObjectURL(file)
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGarmentUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGarmentImage({
          file: file,
          base64: reader.result,
          preview: URL.createObjectURL(file)
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!modelImage?.base64 || !garmentImage?.base64) return;
    
    setIsLoading(true);
    try {
      // Log the data we're about to send
      console.log('Sending request with category:', category);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model_image: modelImage.base64,  // Send the full base64 string including the prefix
          garment_image: garmentImage.base64,  // Send the full base64 string including the prefix
          category: category
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || 'API request failed');
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      if (data.id) {
        // Start polling for result
        let resultData;
        while (true) {
          const statusResponse = await fetch(`${STATUS_URL}/${data.id}`, {
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            }
          });
          
          resultData = await statusResponse.json();
          console.log('Status check:', resultData);
          
          if (resultData.status === 'completed') {
            setResultImage(resultData.output[0]);
            break;
          } else if (resultData.status === 'failed') {
            throw new Error('Processing failed');
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Detailed error:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function to properly convert File to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Add this function to handle closing
  const handleClose = () => {
    // Send message to parent window
    window.parent.postMessage('closeExtension', '*');
  };

  return (
    <div style={{ 
      padding: '20px',  // Reduced from 15px
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
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

      {/* Header and Category Selector Container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: '10px',
        marginBottom: '15px',
        gap: '15px'
      }}>
        <h1 style={{ 
          fontSize: '20px',
          margin: 0,
          color: 'white'
        }}>Virtual Try-On</h1>
      </div>

      {/* Try-On Preview Box */}
      <div style={{ 
        border: '2px solid #444',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '25px',  // Increased from 15px to add more space
        height: '380px',
        width: '310px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
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
        gap: '18px',
        marginTop: '15px',
        marginBottom: '15px',
        justifyContent: 'center'
      }}>
        {/* Model Preview */}
        <div style={{ 
          border: '2px solid #444',
          borderRadius: '8px',
          padding: '4px',  // Reduced padding to allow image to fill more space
          width: '150px',
          height: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {modelImage?.preview ? (
            <div style={{ position: 'relative', width: '132px', height: '162px' }}>  {/* Increased to fill more space */}
              <img 
                src={modelImage.preview} 
                alt="Model preview" 
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }} 
              />
              <button
                onClick={() => setModelImage(null)}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div style={{ color: '#ccc', marginBottom: '10px' }}>Select Model</div>
              <label style={{
                backgroundColor: '#9C27B0',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleModelUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </>
          )}
        </div>

        {/* Garment Preview */}
        <div style={{ 
          border: '2px solid #444',
          borderRadius: '8px',
          padding: '4px',  // Reduced padding to allow image to fill more space
          width: '150px',
          height: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {garmentImage?.preview ? (
            <div style={{ position: 'relative', width: '132px', height: '162px' }}>  {/* Increased to fill more space */}
              <img 
                src={garmentImage.preview} 
                alt="Garment preview" 
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }} 
              />
              <button
                onClick={() => setGarmentImage(null)}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div style={{ color: '#ccc', marginBottom: '10px' }}>Select Garment</div>
              <label style={{
                backgroundColor: '#9C27B0',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGarmentUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Try It On Button and Category Selector Container */}
      <div style={{
        display: 'flex',
        gap: '18px',
        justifyContent: 'center',
        marginTop: 'auto',
        width: '340px',  // Match container width
        alignSelf: 'center'
      }}>
        <button 
          style={{
            padding: '8px 16px',
            backgroundColor: modelImage && garmentImage ? '#9C27B0' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: modelImage && garmentImage ? 'pointer' : 'not-allowed',
            width: '190px',  // Half of 290px minus gap
          }}
          onClick={handleTryOn}
          disabled={!modelImage || !garmentImage || isLoading}
        >
          {isLoading ? 'Processing...' : 'Try It On'}
        </button>

        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: '190px',  // Match button width
            padding: '8px 16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <option value="tops">Tops</option>
          <option value="bottoms">Bottoms</option>
        </select>
      </div>
    </div>
  );
};

export default App;