const sharp = require('sharp');

module.exports = async (req, res) => {
    const imageBuffer = req.body;

    try {
        const { info } = await sharp(imageBuffer).metadata();

        if (!info) {
            return res.status(400).json({ message: 'Cannot get image properties.' });
        }

        const nsfwProb = estimateNSFWProbability(info);
        res.status(200).json({ nsfwProbability: nsfwProb });
    } catch (error) {
        res.status(500).json({ message: 'Error processing image.', error: error.message });
    }
};

function estimateNSFWProbability(info) {
    // Skin tone detection logic:
    const skinToneThreshold = 0.25; // Example threshold
    const contrastThreshold = 100; // Example threshold
    const saturationThreshold = 1.5; // Example threshold

    // Basic simulation using image properties (these can be enhanced)
    let nsfwScore = 0;

    // Estimate skin tone
    if (info.width && info.height) {
        const aspectRatio = info.width / info.height;
        if (aspectRatio > 1.5) nsfwScore += 0.1; // Landscape images
        else if (aspectRatio < 0.7) nsfwScore += 0.1; // Portrait images
    }

    // Using example properties to estimate NSFW probability
    if (info.format === 'jpeg') nsfwScore += 0.2;
    if (info.format === 'png') nsfwScore += 0.1;
    
    nsfwScore = nsfwScore > 1 ? 1 : nsfwScore;
    return nsfwScore;
}