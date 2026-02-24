// upload.js

const nsfw = require('nsfwjs');
const fetch = require('node-fetch');

// Initialize the model
let model;

const initModel = async () => {
    try {
        model = await nsfw.load();
        console.log('NSFW model loaded successfully.');
    } catch (error) {
        console.error('Error loading the NSFW model:', error);
    }
};

const detectNSFW = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl, { 
            method: 'GET',
            headers: {
                'crossOrigin': 'anonymous'
            }
        });
        const blob = await response.blob();
        const predictions = await model.classify(blob);
        return predictions;
    } catch (error) {
        console.error('Error during NSFW detection:', error);
        throw new Error('NSFW detection failed');
    }
};

const handleImageUpload = async (imgUrl) => {
    try {
        const predictions = await detectNSFW(imgUrl);
        console.log('NSFW Detection Predictions:', predictions);
        // Further processing based on predictions...
    } catch (error) {
        console.error('Failed to handle image upload:', error);
    }
};

// Initialize the model when the script starts
initModel();

module.exports = { handleImageUpload };