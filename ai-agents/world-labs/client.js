/**
 * World Labs API Client
 * Marble - AI-generated 3D worlds
 * https://docs.worldlabs.ai
 */

const API_BASE = 'https://api.worldlabs.ai';

class WorldLabsClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('WORLDLABS_API_KEY required');
    }
    this.apiKey = apiKey;
  }

  async _request(method, endpoint, body = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'WLT-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`World Labs API error ${response.status}: ${error}`);
    }

    return response.json();
  }

  /**
   * Generate a 3D world from text prompt
   * @param {Object} options
   * @param {string} options.prompt - Text description
   * @param {string} [options.model] - "Marble 0.1-plus" or "Marble 0.1-mini"
   * @returns {Promise<string>} operation_id
   */
  async generateFromText({ prompt, model = 'Marble 0.1-plus' }) {
    const result = await this._request('POST', '/marble/v1/worlds:generate', {
      prompt,
      model,
    });
    return result.operation_id;
  }

  /**
   * Generate from image URL
   * @param {Object} options
   * @param {string} options.imageUrl - Public image URL
   * @param {string} [options.prompt] - Optional refinement prompt
   * @param {string} [options.model] - Model version
   * @returns {Promise<string>} operation_id
   */
  async generateFromImage({ imageUrl, prompt = '', model = 'Marble 0.1-plus' }) {
    const result = await this._request('POST', '/marble/v1/worlds:generate', {
      image_url: imageUrl,
      prompt,
      model,
    });
    return result.operation_id;
  }

  /**
   * Generate from multiple images
   * @param {Object} options
   * @param {string[]} options.imageUrls - Array of public image URLs
   * @param {string} [options.prompt] - Optional refinement prompt
   * @param {string} [options.model] - Model version
   * @returns {Promise<string>} operation_id
   */
  async generateFromImages({ imageUrls, prompt = '', model = 'Marble 0.1-plus' }) {
    const result = await this._request('POST', '/marble/v1/worlds:generate', {
      image_urls: imageUrls,
      prompt,
      model,
    });
    return result.operation_id;
  }

  /**
   * Poll operation status
   * @param {string} operationId
   * @returns {Promise<Object>} { status, world_id?, error? }
   */
  async getOperation(operationId) {
    return this._request('GET', `/marble/v1/operations/${operationId}`);
  }

  /**
   * Get world details and download URLs
   * @param {string} worldId
   * @returns {Promise<Object>} World metadata with download URLs
   */
  async getWorld(worldId) {
    return this._request('GET', `/marble/v1/worlds/${worldId}`);
  }

  /**
   * Wait for generation to complete
   * @param {string} operationId
   * @param {Object} [options]
   * @param {number} [options.pollInterval] - Ms between polls (default 5000)
   * @param {number} [options.timeout] - Max wait time in ms (default 300000 = 5 min)
   * @param {function} [options.onProgress] - Callback for status updates
   * @returns {Promise<Object>} Completed world data
   */
  async waitForCompletion(operationId, options = {}) {
    const {
      pollInterval = 5000,
      timeout = 300000,
      onProgress = () => {},
    } = options;

    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Operation timed out after ${timeout}ms`);
      }

      const operation = await this.getOperation(operationId);
      onProgress(operation);

      if (operation.status === 'COMPLETED') {
        return this.getWorld(operation.world_id);
      }

      if (operation.status === 'FAILED') {
        throw new Error(`Generation failed: ${operation.error || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * High-level: Generate and wait for result
   * @param {Object} options - Same as generateFromText/generateFromImage
   * @returns {Promise<Object>} World data with download URLs
   */
  async generate(options) {
    let operationId;

    if (options.imageUrl) {
      operationId = await this.generateFromImage(options);
    } else if (options.imageUrls) {
      operationId = await this.generateFromImages(options);
    } else if (options.prompt) {
      operationId = await this.generateFromText(options);
    } else {
      throw new Error('Must provide prompt, imageUrl, or imageUrls');
    }

    console.log(`Generation started: ${operationId}`);

    return this.waitForCompletion(operationId, {
      onProgress: (op) => {
        console.log(`Status: ${op.status}`);
      },
    });
  }
}

module.exports = { WorldLabsClient };

// CLI usage
if (require.main === module) {
  const apiKey = process.env.WORLDLABS_API_KEY;
  
  if (!apiKey) {
    console.error('Set WORLDLABS_API_KEY environment variable');
    process.exit(1);
  }

  const prompt = process.argv[2] || 'dark stone maze with torches and mysterious fog';
  
  console.log(`Generating world: "${prompt}"`);
  
  const client = new WorldLabsClient(apiKey);
  client.generate({ prompt })
    .then(world => {
      console.log('World generated!');
      console.log(JSON.stringify(world, null, 2));
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
