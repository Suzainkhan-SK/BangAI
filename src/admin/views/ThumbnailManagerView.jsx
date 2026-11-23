import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../adminService';

// Comprehensive Default Providers Specifications
const DEFAULT_PROVIDERS = [
  {
    id: 'kie.ai',
    name: 'Kie.ai Vision Engine',
    icon: '⚡',
    desc: 'Primary 4K high-CTR vision API with multi-key failover and CDN storage.',
    mode: 'async',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.kie.ai/api/v1/jobs/createTask',
    generateMethod: 'POST',
    payloadFormat: 'kie',
    defaultModel: 'gpt-image/2.5-flare',
    responseTaskIdPath: 'data.taskId',
    pollUrlTemplate: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{taskId}}',
    pollStatusPath: 'data.state',
    pollSuccessValue: 'SUCCESS',
    pollResultUrlPath: 'data.resultUrl',
    balanceUrl: 'https://api.kie.ai/api/v1/chat/credit',
    balanceMethod: 'GET',
    balanceValuePath: 'data',
    balanceUnit: 'Credits'
  },
  {
    id: 'together',
    name: 'Together AI',
    icon: '🧠',
    desc: 'High-throughput cloud GPU engine with instant sync image synthesis.',
    mode: 'sync',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.together.xyz/v1/images/generations',
    generateMethod: 'POST',
    payloadFormat: 'openai',
    defaultModel: 'black-forest-labs/FLUX.1-schnell-Free',
    responseImageUrlPath: 'data[0].url',
    balanceUrl: 'https://api.together.xyz/v1/models',
    balanceMethod: 'GET',
    balanceValuePath: '',
    balanceUnit: 'Status'
  },
  {
    id: 'openai',
    name: 'OpenAI / Custom Compatible',
    icon: '🌐',
    desc: 'DALL-E 3 & OpenAI-compatible /v1/images/generations endpoints with custom baseUrl.',
    mode: 'sync',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.openai.com/v1/images/generations',
    generateMethod: 'POST',
    payloadFormat: 'openai',
    defaultModel: 'dall-e-3',
    responseImageUrlPath: 'data[0].url',
    balanceUrl: 'https://api.openai.com/v1/models',
    balanceMethod: 'GET',
    balanceValuePath: '',
    balanceUnit: 'Status'
  },
  {
    id: 'fal.ai',
    name: 'Fal.ai Fast Vision',
    icon: '🚀',
    desc: 'Ultra-fast inference queue API supporting FLUX, Recraft, and Ideogram.',
    mode: 'async',
    authHeaderType: 'Key',
    generateUrl: 'https://queue.fal.run/{{model}}',
    generateMethod: 'POST',
    payloadFormat: 'fal',
    defaultModel: 'fal-ai/flux/schnell',
    responseTaskIdPath: 'request_id',
    pollUrlTemplate: 'https://queue.fal.run/{{model}}/requests/{{taskId}}/status',
    pollStatusPath: 'status',
    pollSuccessValue: 'COMPLETED',
    pollResultUrlPath: 'images[0].url',
    balanceUrl: 'https://rest.alpha.fal.ai/keys/current',
    balanceMethod: 'GET',
    balanceValuePath: '',
    balanceUnit: 'Status'
  },
  {
    id: 'replicate',
    name: 'Replicate',
    icon: '🔄',
    desc: 'Flagship open-source model hub hosting FLUX Schnell, Dev, and SDXL.',
    mode: 'async',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.replicate.com/v1/models/{{model}}/predictions',
    generateMethod: 'POST',
    payloadFormat: 'replicate',
    defaultModel: 'black-forest-labs/flux-schnell',
    responseTaskIdPath: 'id',
    pollUrlTemplate: 'https://api.replicate.com/v1/predictions/{{taskId}}',
    pollStatusPath: 'status',
    pollSuccessValue: 'succeeded',
    pollResultUrlPath: 'output[0]',
    balanceUrl: 'https://api.replicate.com/v1/account',
    balanceMethod: 'GET',
    balanceValuePath: 'username',
    balanceUnit: 'User'
  }
];

const INITIAL_PROVIDER_FORM = {
  id: '',
  name: '',
  icon: '⚡',
  desc: '',
  mode: 'sync',
  authHeaderType: 'Bearer',
  customHeaderName: 'X-API-Key',
  authPrefix: 'Bearer ',
  generateUrl: 'https://api.example.com/v1/images/generations',
  generateMethod: 'POST',
  payloadFormat: 'openai',
  defaultModel: '',
  customPayloadTemplate: '{\n  "model": "{{model}}",\n  "prompt": "{{prompt}}",\n  "aspect_ratio": "{{aspectRatio}}"\n}',
  responseImageUrlPath: 'data[0].url',
  responseTaskIdPath: 'data.taskId',
  pollUrlTemplate: 'https://api.example.com/v1/jobs/{{taskId}}',
  pollStatusPath: 'status',
  pollSuccessValue: 'SUCCESS',
  pollResultUrlPath: 'resultUrl',
  balanceUrl: '',
  balanceMethod: 'GET',
  balanceValuePath: 'data',
  balanceUnit: 'Credits'
};

export default function ThumbnailManagerView() {
  const [activeTab, setActiveTab] = useState('providers'); // 'providers' | 'balances' | 'models' | 'system_prompt' | 'presets' | 'diagnostics' | 'logs' | 'ai_architect'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // ── Engine Configuration State ──
  const [activeProvider, setActiveProvider] = useState('kie.ai');
  const [providerRotationEnabled, setProviderRotationEnabled] = useState(true);
  const [fallbackChain, setFallbackChain] = useState(['kie.ai', 'fal.ai', 'replicate', 'together', 'openai']);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [systemPromptEnabled, setSystemPromptEnabled] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('--no watermark, no blur, no low resolution, no deformed faces');
  const [defaultAspectRatio, setDefaultAspectRatio] = useState('16:9');
  const [defaultResolution, setDefaultResolution] = useState('2K');

  // ── Custom Providers Specifications Map ──
  const [customProviders, setCustomProviders] = useState({});
  const [providersList, setProvidersList] = useState(DEFAULT_PROVIDERS);

  // ── Models & Presets State ──
  const [models, setModels] = useState([]);
  const [presets, setPresets] = useState([]);
  const [styles, setStyles] = useState([]);

  // ── Provider Keys State ──
  const [keysByProvider, setKeysByProvider] = useState({
    'kie.ai': { name: 'Kie.ai Vision Engine', icon: '⚡', keys: [], enabled: true },
    'fal.ai': { name: 'Fal.ai Fast Vision', icon: '🚀', keys: [], enabled: true },
    'replicate': { name: 'Replicate', icon: '🔄', keys: [], enabled: true },
    'together': { name: 'Together AI', icon: '🧠', keys: [], enabled: true },
    'openai': { name: 'OpenAI / Custom Compatible', icon: '🌐', baseUrl: 'https://api.openai.com/v1', keys: [], enabled: true }
  });

  // ── Balance Checking State (Tab 2) ──
  const [selectedBalanceProvider, setSelectedBalanceProvider] = useState('kie.ai');
  const [keyBalances, setKeyBalances] = useState({});
  const [checkingKey, setCheckingKey] = useState({});
  const [checkingAll, setCheckingAll] = useState(false);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [addKeyInput, setAddKeyInput] = useState('');

  // ── Provider Configuration Modal (Add & Edit) ──
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerModalMode, setProviderModalMode] = useState('add'); // 'add' | 'edit'
  const [providerForm, setProviderForm] = useState(INITIAL_PROVIDER_FORM);

  // ── UI Filters & Helpers ──
  const [modelTypeFilter, setModelTypeFilter] = useState('all');
  const [modelSearch, setModelSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPresetModal, setShowAddPresetModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState({});

  // ── Real-Time Activity Logs State (Tab 7) ──
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'success' | 'errors' | 'rotations'
  const logTimerRef = useRef(null);

  // ── Live Generation Test State ──
  const [testProvider, setTestProvider] = useState('kie.ai');
  const [testModel, setTestModel] = useState('');
  const [testPrompt, setTestPrompt] = useState('Viral challenge thumbnail: Shocked creator finding a colossal $10,000,000 golden vault open in a dark cave, volumetric light rays');
  const [testRatio, setTestRatio] = useState('16:9');
  const [testRes, setTestRes] = useState('1K');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  // ── New Model Form State ──
  const [newModel, setNewModel] = useState({
    id: '',
    name: '',
    provider: 'kie.ai',
    providerModelId: '',
    fallbackModelId: '',
    badge: 'VIRAL 4K',
    badgeColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
    credits: 6,
    creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
    type: 'text-to-image',
    supportedResolutions: ['1K', '2K', '4K'],
    enabled: true,
    description: '',
    defaultPrompt: '',
    showcaseImage: '/showcases/gpt_flare_2_5_ultra.png',
    endpointOverride: {
      enabled: false,
      generateUrl: '',
      generateMethod: 'POST',
      payloadFormat: 'openai',
      customPayloadTemplate: '{\n  "model": "{{model}}",\n  "prompt": "{{prompt}}",\n  "aspect_ratio": "{{aspectRatio}}"\n}'
    }
  });

  // ── New Preset Form State ──
  const [newPreset, setNewPreset] = useState({
    id: '',
    emoji: '🔥',
    label: '',
    prompt: '',
    aspectRatio: '16:9',
    modelId: '',
    enabled: true
  });

  // ── AI Provider Architect State ──
  const [architectMessages, setArchitectMessages] = useState([
    { role: 'assistant', content: JSON.stringify({ reply: "👋 Hello! I'm the **Bang AI Provider Architect**. I can configure any image generation service for your Thumbnail Studio automatically.\n\nJust paste in the API documentation, a cURL example, or describe the service you want to add (like \"I want to add Ideogram AI\" or \"Add Fal.ai with my key: xyz123\").\n\nI'll extract all the endpoints, authentication headers, and model slugs for you, test the connection, and apply the configuration with one click!", action: 'need_more_info', extractedConfig: null, confidence: 100 }) }
  ]);
  const [architectInput, setArchitectInput] = useState('');
  const [architectLoading, setArchitectLoading] = useState(false);
  const [architectError, setArchitectError] = useState(null);
  const [pendingConfig, setPendingConfig] = useState(null);
  const [applyingConfig, setApplyingConfig] = useState(false);
  const [architectApiKey, setArchitectApiKey] = useState('');
  const architectChatRef = useRef(null);

  // ── Bulk Model Importer State ──
  const [showModelImporter, setShowModelImporter] = useState(false);
  const [importerProvider, setImporterProvider] = useState('kie.ai');
  const [importerUrl, setImporterUrl] = useState('');
  const [importerPath, setImporterPath] = useState('');
  const [importerAuth, setImporterAuth] = useState('Bearer');
  const [importerApiKey, setImporterApiKey] = useState('');
  const [importerModels, setImporterModels] = useState([]);
  const [importerLoading, setImporterLoading] = useState(false);
  const [importerError, setImporterError] = useState(null);
  const [importerSelected, setImporterSelected] = useState(new Set());
  const [importerFilter, setImporterFilter] = useState('');
  const [importerCredits, setImporterCredits] = useState({ '1K': 6, '2K': 10, '4K': 16 });
  const [importerSuccess, setImporterSuccess] = useState('');

  // Load configuration from MongoDB Atlas
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await adminService.getThumbnailConfig();
      if (res.success && res.config) {
        const c = res.config;
        setActiveProvider(c.activeProvider || 'kie.ai');
        setProviderRotationEnabled(c.providerRotationEnabled ?? true);
        setFallbackChain(c.fallbackChain || ['kie.ai', 'fal.ai', 'replicate', 'together', 'openai']);
        setSystemPrompt(c.systemPrompt || '');
        setSystemPromptEnabled(Boolean(c.systemPromptEnabled));
        setNegativePrompt(c.negativePrompt || '');
        setDefaultAspectRatio(c.defaultAspectRatio || '16:9');
        setDefaultResolution(c.defaultResolution || '2K');
        setModels(c.models || []);
        setPresets(c.presets || []);
        setStyles(c.styles || []);
        setCustomProviders(c.customProviders || {});

        if (c.models?.length > 0 && !testModel) {
          setTestModel(c.models[0].id);
        }

        // Merge default and custom providers into providersList
        const merged = [...DEFAULT_PROVIDERS];
        const existingIds = new Set(merged.map(p => p.id));

        if (c.customProviders) {
          Object.entries(c.customProviders).forEach(([pid, pmeta]) => {
            if (existingIds.has(pid)) {
              // Update default with user custom overrides
              const idx = merged.findIndex(p => p.id === pid);
              if (idx >= 0) merged[idx] = { ...merged[idx], ...pmeta };
            } else {
              merged.push({ ...INITIAL_PROVIDER_FORM, ...pmeta, id: pid });
            }
          });
        }

        if (res.keys?.providers) {
          Object.entries(res.keys.providers).forEach(([pid, pdata]) => {
            if (!existingIds.has(pid) && !merged.some(p => p.id === pid)) {
              merged.push({
                ...INITIAL_PROVIDER_FORM,
                id: pid,
                name: pdata.name || pid,
                icon: pdata.icon || '🌐',
                generateUrl: pdata.baseUrl || ''
              });
            }
          });
        }
        setProvidersList(merged);
      }

      if (res.success && res.keys?.providers) {
        setKeysByProvider(res.keys.providers);
      }
    } catch (err) {
      console.error('Failed to load thumbnail config:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time thumbnail logs
  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await adminService.getThumbnailLogs(150);
      if (res.success && Array.isArray(res.logs)) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to fetch thumbnail logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all real-time activity logs?')) return;
    try {
      await adminService.clearThumbnailLogs();
      setLogs([]);
    } catch (err) {
      alert('Failed to clear logs: ' + err.message);
    }
  };

  // ── AI ARCHITECT HANDLER ──
  const handleArchitectSend = async () => {
    if (!architectInput.trim() || architectLoading) return;
    setArchitectError(null);
    const userMsg = { role: 'user', content: architectInput.trim() };
    const updatedMsgs = [...architectMessages, userMsg];
    setArchitectMessages(updatedMsgs);
    setArchitectInput('');
    setArchitectLoading(true);

    try {
      // Convert messages to plain text format for the backend
      const msgPayload = updatedMsgs.map(m => {
        let content = m.content;
        // Parse JSON messages (assistant ones stored as JSON) to extract reply
        if (m.role === 'assistant') {
          try {
            const parsed = JSON.parse(m.content);
            content = parsed.reply || m.content;
          } catch {}
        }
        return { role: m.role, content };
      });

      const res = await adminService.askThumbnailAiArchitect(msgPayload, {
        providedApiKey: architectApiKey || undefined
      });

      if (res.success) {
        const assistantMsgContent = JSON.stringify({
          reply: res.reply || 'Configuration analysis complete.',
          action: res.action || 'CHAT',
          executed: res.executed || null,
          extractedConfig: res.extractedConfig || null,
          extractedModels: res.extractedModels || [],
          testEndpoint: res.testEndpoint || null,
          confidence: res.confidence || 0
        });
        setArchitectMessages(prev => [...prev, { role: 'assistant', content: assistantMsgContent }]);
        if (res.extractedConfig) setPendingConfig(res.extractedConfig);

        // Auto-reload config if the AI executed database modifications
        if (res.reloadConfig) {
          await loadConfig();
          setSavedMsg('✅ Live state updated by AI Architect!');
          setTimeout(() => setSavedMsg(''), 4000);
        }
      } else {
        setArchitectError(res.error || 'AI Architect returned an error');
      }
    } catch (err) {
      setArchitectError(err.message);
    } finally {
      setArchitectLoading(false);
      setTimeout(() => {
        if (architectChatRef.current) architectChatRef.current.scrollTop = architectChatRef.current.scrollHeight;
      }, 100);
    }
  };

  const handleArchitectApply = async (cfg, setAsPrimary = false) => {
    if (!cfg || !cfg.id) { alert('No valid provider configuration to apply.'); return; }
    setApplyingConfig(true);
    try {
      const res = await adminService.applyArchitectProvider(cfg, architectApiKey || null, setAsPrimary);
      if (res.success) {
        setArchitectMessages(prev => [...prev, {
          role: 'assistant',
          content: JSON.stringify({ reply: `✅ **${cfg.name || cfg.id}** has been configured and saved!\n\n${architectApiKey ? '🔑 API key saved to the vault.' : ''}\n${setAsPrimary ? '⭐ Set as primary generation provider.' : ''}\n\nYou can now use this provider in the Thumbnail Studio. Click "Save Configuration" to finalize all settings.`, action: 'apply_config', extractedConfig: null, confidence: 100 })
        }]);
        setPendingConfig(null);
        await loadConfig();
        setSavedMsg(`✅ Provider "${cfg.name || cfg.id}" applied successfully!`);
        setTimeout(() => setSavedMsg(''), 4000);
      } else {
        alert('Apply failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Apply failed: ' + err.message);
    } finally {
      setApplyingConfig(false);
    }
  };

  // ── BULK MODEL IMPORTER HANDLER ──
  const handleFetchImporterModels = async () => {
    if (!importerUrl.trim()) { setImporterError('Please enter a models listing URL first.'); return; }
    setImporterLoading(true);
    setImporterError(null);
    setImporterModels([]);
    setImporterSelected(new Set());
    setImporterSuccess('');
    try {
      const res = await adminService.fetchProviderModels(importerProvider, importerUrl.trim(), 'GET', importerPath.trim(), importerAuth, importerApiKey.trim() || null);
      if (res.success && Array.isArray(res.models)) {
        setImporterModels(res.models);
        if (res.models.length === 0) setImporterError('No models found at this endpoint. Check the path configuration.');
      } else {
        setImporterError(res.error || 'No models returned from endpoint.');
      }
    } catch (err) {
      setImporterError(err.message);
    } finally {
      setImporterLoading(false);
    }
  };

  const handleBulkImportModels = async () => {
    if (importerSelected.size === 0) { alert('Please select at least one model to import.'); return; }
    const toImport = importerModels.filter(m => importerSelected.has(m.id)).map(m => ({
      id: m.id,
      name: m.name || m.id,
      provider: importerProvider,
      providerModelId: m.id,
      description: m.description || '',
      type: 'text-to-image'
    }));
    try {
      const res = await adminService.bulkAddThumbnailModels(toImport, importerCredits, importerProvider);
      if (res.success) {
        setImporterSuccess(`✅ ${res.added} models added! (${res.skipped} skipped as duplicates). Total: ${res.totalModels} models.`);
        setImporterSelected(new Set());
        await loadConfig();
      } else {
        setImporterError(res.error || 'Bulk import failed');
      }
    } catch (err) {
      setImporterError(err.message);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Poll logs automatically when Tab 7 is active and autoRefreshLogs is enabled
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
      if (autoRefreshLogs) {
        logTimerRef.current = setInterval(fetchLogs, 3000);
      }
    } else {
      if (logTimerRef.current) clearInterval(logTimerRef.current);
    }
    return () => {
      if (logTimerRef.current) clearInterval(logTimerRef.current);
    };
  }, [activeTab, autoRefreshLogs]);

  // Save all thumbnail configuration to MongoDB Atlas
  const handleSaveAll = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const configPayload = {
        activeProvider,
        providerRotationEnabled,
        fallbackChain,
        systemPrompt,
        systemPromptEnabled,
        negativePrompt,
        defaultAspectRatio,
        defaultResolution,
        customProviders,
        models,
        presets,
        styles
      };

      const res = await adminService.saveThumbnailConfig(configPayload, { providers: keysByProvider });
      if (res.success) {
        setSavedMsg('✅ All Thumbnail Studio settings, custom providers, and API keys saved successfully to MongoDB Atlas!');
        setTimeout(() => setSavedMsg(''), 5000);
      } else {
        setSavedMsg(`❌ Save failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSavedMsg(`❌ Error saving thumbnail settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── PROVIDER MODAL HANDLERS (ADD & EDIT) ──
  const handleOpenAddProvider = () => {
    setProviderModalMode('add');
    setProviderForm(INITIAL_PROVIDER_FORM);
    setShowProviderModal(true);
  };

  const handleOpenEditProvider = (providerId) => {
    const prov = providersList.find(p => p.id === providerId) || customProviders[providerId] || DEFAULT_PROVIDERS.find(p => p.id === providerId) || {};
    setProviderModalMode('edit');
    setProviderForm({
      ...INITIAL_PROVIDER_FORM,
      ...prov,
      id: providerId
    });
    setShowProviderModal(true);
  };

  const handleApplyTemplate = (tplType) => {
    if (tplType === 'openai') {
      setProviderForm(prev => ({
        ...prev,
        mode: 'sync',
        authHeaderType: 'Bearer',
        generateUrl: 'https://api.openai.com/v1/images/generations',
        generateMethod: 'POST',
        payloadFormat: 'openai',
        defaultModel: 'dall-e-3',
        responseImageUrlPath: 'data[0].url',
        balanceUrl: 'https://api.openai.com/v1/models',
        balanceMethod: 'GET',
        balanceValuePath: '',
        balanceUnit: 'Status'
      }));
    } else if (tplType === 'kie') {
      setProviderForm(prev => ({
        ...prev,
        mode: 'async',
        authHeaderType: 'Bearer',
        generateUrl: 'https://api.kie.ai/api/v1/jobs/createTask',
        generateMethod: 'POST',
        payloadFormat: 'kie',
        defaultModel: 'gpt-image/2.5-flare',
        responseTaskIdPath: 'data.taskId',
        pollUrlTemplate: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{taskId}}',
        pollStatusPath: 'data.state',
        pollSuccessValue: 'SUCCESS',
        pollResultUrlPath: 'data.resultUrl',
        balanceUrl: 'https://api.kie.ai/api/v1/chat/credit',
        balanceMethod: 'GET',
        balanceValuePath: 'data',
        balanceUnit: 'Credits'
      }));
    } else if (tplType === 'fal') {
      setProviderForm(prev => ({
        ...prev,
        mode: 'async',
        authHeaderType: 'Key',
        generateUrl: 'https://queue.fal.run/{{model}}',
        generateMethod: 'POST',
        payloadFormat: 'fal',
        defaultModel: 'fal-ai/flux/schnell',
        responseTaskIdPath: 'request_id',
        pollUrlTemplate: 'https://queue.fal.run/{{model}}/requests/{{taskId}}/status',
        pollStatusPath: 'status',
        pollSuccessValue: 'COMPLETED',
        pollResultUrlPath: 'images[0].url',
        balanceUrl: 'https://rest.alpha.fal.ai/keys/current',
        balanceMethod: 'GET',
        balanceValuePath: '',
        balanceUnit: 'Status'
      }));
    } else if (tplType === 'replicate') {
      setProviderForm(prev => ({
        ...prev,
        mode: 'async',
        authHeaderType: 'Bearer',
        generateUrl: 'https://api.replicate.com/v1/models/{{model}}/predictions',
        generateMethod: 'POST',
        payloadFormat: 'replicate',
        defaultModel: 'black-forest-labs/flux-schnell',
        responseTaskIdPath: 'id',
        pollUrlTemplate: 'https://api.replicate.com/v1/predictions/{{taskId}}',
        pollStatusPath: 'status',
        pollSuccessValue: 'succeeded',
        pollResultUrlPath: 'output[0]',
        balanceUrl: 'https://api.replicate.com/v1/account',
        balanceMethod: 'GET',
        balanceValuePath: 'username',
        balanceUnit: 'User'
      }));
    } else if (tplType === 'together') {
      setProviderForm(prev => ({
        ...prev,
        mode: 'sync',
        authHeaderType: 'Bearer',
        generateUrl: 'https://api.together.xyz/v1/images/generations',
        generateMethod: 'POST',
        payloadFormat: 'openai',
        defaultModel: 'black-forest-labs/FLUX.1-schnell-Free',
        responseImageUrlPath: 'data[0].url',
        balanceUrl: 'https://api.together.xyz/v1/models',
        balanceMethod: 'GET',
        balanceValuePath: '',
        balanceUnit: 'Status'
      }));
    }
  };

  const handleSaveProviderModal = (e) => {
    e.preventDefault();
    const pid = providerForm.id.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-');
    if (!pid || !providerForm.name.trim()) {
      alert('Provider ID and Display Name are required.');
      return;
    }

    const updatedObj = {
      ...providerForm,
      id: pid,
      name: providerForm.name.trim(),
      icon: providerForm.icon || '⚡',
      generateUrl: providerForm.generateUrl.trim(),
      balanceUrl: (providerForm.balanceUrl || '').trim()
    };

    // Update customProviders map
    setCustomProviders(prev => ({ ...prev, [pid]: updatedObj }));

    // Update providersList
    setProvidersList(prev => {
      const idx = prev.findIndex(p => p.id === pid);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updatedObj };
        return copy;
      }
      return [...prev, updatedObj];
    });

    // Ensure key vault entry exists
    setKeysByProvider(prev => ({
      ...prev,
      [pid]: {
        ...(prev[pid] || { keys: [] }),
        name: updatedObj.name,
        icon: updatedObj.icon,
        baseUrl: updatedObj.generateUrl,
        enabled: true
      }
    }));

    // Ensure fallback chain includes provider
    if (!fallbackChain.includes(pid)) {
      setFallbackChain(prev => [...prev, pid]);
    }

    setSelectedBalanceProvider(pid);
    setShowProviderModal(false);
  };

  const handleDeleteProvider = (providerId) => {
    if (!window.confirm(`Delete provider '${providerId}' and remove its keys?`)) return;
    setProvidersList(prev => prev.filter(p => p.id !== providerId));
    setCustomProviders(prev => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    setKeysByProvider(prev => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    setFallbackChain(prev => prev.filter(p => p !== providerId));
    if (activeProvider === providerId) setActiveProvider('kie.ai');
    if (selectedBalanceProvider === providerId) setSelectedBalanceProvider('kie.ai');
  };

  // Move Provider in Fallback Priority Chain
  const moveProviderInChain = (index, direction) => {
    const newChain = [...fallbackChain];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newChain.length) return;
    const temp = newChain[index];
    newChain[index] = newChain[targetIdx];
    newChain[targetIdx] = temp;
    setFallbackChain(newChain);
  };

  // ── KEY BALANCE CHECKING (PASSES COMPLETE ENDPOINT SPEC) ──
  const handleCheckKeyBalance = async (providerId, key) => {
    setCheckingKey(prev => ({ ...prev, [key]: true }));
    try {
      const pDef = customProviders[providerId] || providersList.find(p => p.id === providerId) || keysByProvider[providerId] || {};
      const res = await adminService.checkThumbnailKeyBalance({
        provider: providerId,
        key,
        baseUrl: pDef.baseUrl || pDef.generateUrl,
        balanceUrl: pDef.balanceUrl,
        balanceMethod: pDef.balanceMethod || 'GET',
        authHeaderType: pDef.authHeaderType || 'Bearer',
        customHeaderName: pDef.customHeaderName,
        authPrefix: pDef.authPrefix,
        balanceValuePath: pDef.balanceValuePath || 'data',
        balanceUnit: pDef.balanceUnit || 'Credits'
      });

      if (res.success) {
        setKeyBalances(prev => ({ ...prev, [key]: res }));
      } else {
        setKeyBalances(prev => ({
          ...prev,
          [key]: { status: 'invalid', balanceFormatted: 'Check Failed', details: res.error || 'Error' }
        }));
      }
    } catch (err) {
      setKeyBalances(prev => ({
        ...prev,
        [key]: { status: 'invalid', balanceFormatted: 'Network Error', details: err.message }
      }));
    } finally {
      setCheckingKey(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCheckAllBalancesForProvider = async (providerId) => {
    const keysList = keysByProvider[providerId]?.keys || [];
    if (keysList.length === 0) return;
    setCheckingAll(true);
    for (const key of keysList) {
      await handleCheckKeyBalance(providerId, key);
    }
    setCheckingAll(false);
  };

  // Add Keys in Bulk to Selected Provider
  const handleAddKeysToSelectedProvider = (providerId) => {
    const raw = (addKeyInput || '').trim();
    if (!raw) return;
    const newItems = raw
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k && k.length > 5);

    if (newItems.length === 0) return;

    setKeysByProvider(prev => {
      const current = prev[providerId] || { keys: [], enabled: true };
      const existing = current.keys || [];
      const merged = Array.from(new Set([...existing, ...newItems]));
      return {
        ...prev,
        [providerId]: {
          ...current,
          keys: merged
        }
      };
    });

    setAddKeyInput('');
    setShowAddKeyModal(false);
  };

  const handleDeleteKeyFromProvider = (providerId, keyToDelete) => {
    if (!window.confirm('Delete this API key from the provider vault?')) return;
    setKeysByProvider(prev => {
      const current = prev[providerId] || { keys: [] };
      return {
        ...prev,
        [providerId]: {
          ...current,
          keys: (current.keys || []).filter(k => k !== keyToDelete)
        }
      };
    });
  };

  // ── MODEL MANAGEMENT HANDLERS ──
  const handleUpdateModelField = (modelId, field, value) => {
    setModels(prev => prev.map(m => (m.id === modelId ? { ...m, [field]: value } : m)));
  };

  const handleUpdateModelCredits = (modelId, resTier, value) => {
    const num = parseFloat(value) || 0;
    setModels(prev => prev.map(m => {
      if (m.id !== modelId) return m;
      const currentMatrix = m.creditsByResolution || { '1K': 6, '2K': 10, '4K': 16 };
      return {
        ...m,
        creditsByResolution: {
          ...currentMatrix,
          [resTier]: num
        }
      };
    }));
  };

  const handleDeleteModel = (modelId) => {
    if (!window.confirm(`Delete model '${modelId}'?`)) return;
    setModels(prev => prev.filter(m => m.id !== modelId));
  };

  const handleAddModel = (e) => {
    e.preventDefault();
    if (!newModel.id.trim() || !newModel.name.trim()) {
      alert('Model ID and Name are required.');
      return;
    }
    setModels(prev => [...prev, { ...newModel, id: newModel.id.trim() }]);
    setShowAddModal(false);
    setNewModel({
      id: '',
      name: '',
      provider: activeProvider || 'kie.ai',
      providerModelId: '',
      fallbackModelId: '',
      badge: 'VIRAL 4K',
      badgeColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
      credits: 6,
      creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
      type: 'text-to-image',
      supportedResolutions: ['1K', '2K', '4K'],
      enabled: true,
      description: '',
      defaultPrompt: '',
      showcaseImage: '/showcases/gpt_flare_2_5_ultra.png',
      endpointOverride: {
        enabled: false,
        generateUrl: '',
        generateMethod: 'POST',
        payloadFormat: 'openai',
        customPayloadTemplate: '{\n  "model": "{{model}}",\n  "prompt": "{{prompt}}",\n  "aspect_ratio": "{{aspectRatio}}"\n}'
      }
    });
  };

  // ── PRESETS HANDLERS ──
  const handleUpdatePresetField = (presetId, field, value) => {
    setPresets(prev => prev.map(p => (p.id === presetId ? { ...p, [field]: value } : p)));
  };

  const handleDeletePreset = (presetId) => {
    if (!window.confirm('Delete this viral preset?')) return;
    setPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const handleAddPreset = (e) => {
    e.preventDefault();
    if (!newPreset.id.trim() || !newPreset.label.trim()) {
      alert('Preset ID and Label are required.');
      return;
    }
    setPresets(prev => [...prev, { ...newPreset, id: newPreset.id.trim() }]);
    setShowAddPresetModal(false);
    setNewPreset({
      id: '',
      emoji: '🔥',
      label: '',
      prompt: '',
      aspectRatio: '16:9',
      modelId: models[0]?.id || '',
      enabled: true
    });
  };

  // Real Live Test Generation
  const handleRunRealTest = async (e) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await adminService.testThumbnailGeneration({
        provider: testProvider,
        model: testModel || models[0]?.id,
        prompt: testPrompt,
        aspectRatio: testRatio,
        resolution: testRes
      });

      if (res.success && res.imageUrl) {
        setTestResult(res);
        fetchLogs();
      } else {
        setTestError(res.error || 'Generation did not return a valid image URL');
      }
    } catch (err) {
      setTestError(err.message || 'Generation test request failed');
    } finally {
      setTesting(false);
    }
  };

  // Filtered models
  const filteredModels = models.filter(m => {
    if (modelTypeFilter !== 'all' && m.type !== modelTypeFilter) return false;
    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.badge?.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered logs
  const filteredLogs = logs.filter(item => {
    if (logFilter === 'success') return item.type === 'GENERATION_SUCCESS' || item.type === 'TASK_COMPLETED';
    if (logFilter === 'errors') return item.type?.includes('FAIL') || item.type?.includes('ERROR') || item.type?.includes('EXHAUST');
    if (logFilter === 'rotations') return item.type === 'KEY_ROTATED_ON_ERROR' || item.type === 'PROVIDER_FAILOVER';
    return true;
  });

  const totalKeysCount = Object.values(keysByProvider).reduce((sum, prov) => sum + (prov.keys?.length || 0), 0);
  const activeModelsCount = models.filter(m => m.enabled !== false).length;

  if (loading) {
    return (
      <div className="admin-view-container" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>
          Loading Thumbnail Studio Engine from MongoDB Atlas...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── HEADER & ACTIONS ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--admin-border-glass)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎨</span>
            <h2 className="admin-view-title" style={{ margin: 0 }}>
              Thumbnail Studio & Multi-Provider Engine Hub
            </h2>
          </div>
          <p className="admin-view-desc" style={{ marginTop: '6px' }}>
            Universal provider endpoints, custom model IDs, multi-key rotation, failover chains, live balances, and real-time generation activity logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="admin-btn admin-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ff4f00 0%, #ff7700 100%)',
              boxShadow: '0 4px 16px rgba(255, 79, 0, 0.4)',
              fontWeight: 800
            }}
          >
            {saving ? 'Saving to Atlas...' : '💾 Save All Thumbnail Settings'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: savedMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: savedMsg.startsWith('✅') ? '1px solid #10b981' : '1px solid #ef4444',
          color: savedMsg.startsWith('✅') ? '#10b981' : '#ef4444',
          fontWeight: 700,
          fontSize: '13px'
        }}>
          {savedMsg}
        </div>
      )}

      {/* ── METRIC STATS STRIP ──────────────────────────────────────── */}
      <div className="admin-grid admin-grid-4" style={{ gap: '12px' }}>
        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Active Primary Provider
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ff4f00', marginTop: '4px' }}>
            {providersList.find(p => p.id === activeProvider)?.name || activeProvider}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Failover Mode
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: providerRotationEnabled ? '#10b981' : 'var(--admin-text-sub)', marginTop: '4px' }}>
            {providerRotationEnabled ? `Auto (${fallbackChain.length} Tiers)` : 'Disabled'}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total API Keys in Vault
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
            {totalKeysCount} Keys ({providersList.length} Providers)
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Active Vision Models
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
            {activeModelsCount} Models Ready
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--admin-border-glass)',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'providers', label: `🌐 Providers & Endpoints (${providersList.length})` },
          { id: 'balances', label: `🔑 API Keys & Live Balances (${totalKeysCount})` },
          { id: 'models', label: `🤖 Vision Models & Credits (${models.length})` },
          { id: 'system_prompt', label: '🧠 System Prompt & Rules' },
          { id: 'presets', label: `🎨 Viral Presets (${presets.length})` },
          { id: 'diagnostics', label: '⚡ Live Diagnostics & Real Test' },
          { id: 'logs', label: `📋 Real-Time Activity & Logs (${logs.length})` },
          { id: 'ai_architect', label: '✨ AI Provider Architect' }
        ].map(t => {
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: isSelected ? 'var(--admin-bg-card)' : 'transparent',
                borderBottom: isSelected ? '2px solid #ff4f00' : '2px solid transparent',
                color: isSelected ? '#ff4f00' : 'var(--admin-text-sub)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: SERVICE PROVIDERS & FAILOVER ENGINE
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'providers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Provider Grid */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                  1. Image Generation Service Providers & Endpoints
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
                  Select primary provider, configure endpoints, auth headers, balance check URLs, or add custom service providers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddProvider}
                className="admin-btn admin-btn-sm"
                style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', color: '#06b6d4', fontWeight: 800 }}
              >
                ➕ Add Custom Service Provider
              </button>
            </div>

            <div className="admin-grid admin-grid-3" style={{ gap: '14px' }}>
              {providersList.map(p => {
                const isSelected = activeProvider === p.id;
                const provData = keysByProvider[p.id] || { keys: [], enabled: true };
                const keyCount = provData.keys?.length || 0;
                const isCustom = !DEFAULT_PROVIDERS.some(dp => dp.id === p.id);
                const pConfig = customProviders[p.id] || p;

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #ff4f00' : '1px solid var(--admin-border-glass)',
                      background: isSelected ? 'rgba(255, 79, 0, 0.08)' : 'var(--admin-bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{p.icon || '🌐'}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            background: pConfig.mode === 'async' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                            color: pConfig.mode === 'async' ? '#c084fc' : '#06b6d4'
                          }}>
                            {pConfig.mode === 'async' ? '⏳ Async Task' : '⚡ Direct Sync'}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            background: keyCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: keyCount > 0 ? '#10b981' : '#ef4444'
                          }}>
                            {keyCount} {keyCount === 1 ? 'Key' : 'Keys'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#ff4f00' : 'var(--admin-text-main)', marginBottom: '4px' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', lineHeight: 1.4, marginBottom: '8px' }}>
                        {p.desc}
                      </div>

                      {/* Endpoint Preview Info Box */}
                      <div style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid var(--admin-border-glass)',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: 'var(--admin-text-sub)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: '#06b6d4' }}>Generate:</strong> {pConfig.generateUrl || provData.baseUrl || 'Default'}
                        </div>
                        {pConfig.mode === 'async' && pConfig.pollUrlTemplate && (
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#a855f7' }}>Poll:</strong> {pConfig.pollUrlTemplate}
                          </div>
                        )}
                        {pConfig.balanceUrl && (
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#10b981' }}>Balance:</strong> {pConfig.balanceUrl}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--admin-border-glass)', paddingTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveProvider(p.id)}
                        className="admin-btn admin-btn-sm"
                        style={{
                          flex: 1,
                          background: isSelected ? '#ff4f00' : 'var(--admin-bg-elevated)',
                          color: isSelected ? '#fff' : 'var(--admin-text-main)',
                          fontWeight: 700
                        }}
                      >
                        {isSelected ? '✓ Primary Active' : 'Set as Primary'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditProvider(p.id)}
                        className="admin-btn admin-btn-sm"
                        style={{ background: 'rgba(255, 79, 0, 0.1)', color: '#ff4f00', border: '1px solid rgba(255, 79, 0, 0.3)', fontWeight: 700 }}
                        title="Edit endpoints, auth headers, and polling settings"
                      >
                        ✏️ Edit Config
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBalanceProvider(p.id);
                          setActiveTab('balances');
                        }}
                        className="admin-btn admin-btn-sm"
                        style={{ fontSize: '11px' }}
                      >
                        🔑 Keys
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(p.id)}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          style={{ padding: '4px 8px' }}
                          title="Delete custom provider"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provider Rotation & Failover Chain */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
                  2. Automatic Provider Rotation & Failover Priority Chain
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                  If all API keys for the current provider are exhausted, rate-limited (HTTP 429), or out of balance,
                  the backend will <strong>automatically switch to the next provider in this fallback chain</strong> to generate the thumbnail without user failure.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: providerRotationEnabled ? '#10b981' : 'var(--admin-text-sub)' }}>
                  {providerRotationEnabled ? 'AUTO-FAILOVER ENABLED' : 'AUTO-FAILOVER DISABLED'}
                </span>
                <input
                  type="checkbox"
                  checked={providerRotationEnabled}
                  onChange={e => setProviderRotationEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff4f00' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fallbackChain.map((provId, index) => {
                const pMeta = providersList.find(p => p.id === provId) || { id: provId, name: provId, icon: '⚡' };
                const isPrimary = activeProvider === provId;
                const keyCount = keysByProvider[provId]?.keys?.length || 0;

                return (
                  <div
                    key={provId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isPrimary ? 'rgba(255, 79, 0, 0.08)' : 'var(--admin-bg-elevated)',
                      border: isPrimary ? '1px solid rgba(255, 79, 0, 0.3)' : '1px solid var(--admin-border-glass)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-sub)', width: '22px' }}>
                        #{index + 1}
                      </span>
                      <span style={{ fontSize: '16px' }}>{pMeta.icon}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                        {pMeta.name}
                      </span>
                      {isPrimary && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#ff4f00',
                          color: '#fff'
                        }}>
                          PRIMARY ACTIVE
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                        ({keyCount} keys)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => moveProviderInChain(index, -1)}
                        disabled={index === 0}
                        className="admin-btn admin-btn-sm"
                        style={{ padding: '4px 8px' }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveProviderInChain(index, 1)}
                        disabled={index === fallbackChain.length - 1}
                        className="admin-btn admin-btn-sm"
                        style={{ padding: '4px 8px' }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: PROVIDER API KEYS & REAL CREDIT BALANCES
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Provider Selection Rail */}
          <div className="admin-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Select Service Provider to Inspect & Manage API Keys:
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {providersList.map(p => {
                const isSelected = selectedBalanceProvider === p.id;
                const count = keysByProvider[p.id]?.keys?.length || 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedBalanceProvider(p.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #ff4f00' : '1px solid var(--admin-border-glass)',
                      background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'var(--admin-bg-elevated)',
                      color: isSelected ? '#ff4f00' : 'var(--admin-text-main)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{p.icon || '⚡'}</span>
                    <span>{p.name}</span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      background: count > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: count > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Provider Vault Details */}
          {(() => {
            const currentProv = keysByProvider[selectedBalanceProvider] || { keys: [], enabled: true };
            const keysList = currentProv.keys || [];
            const meta = providersList.find(p => p.id === selectedBalanceProvider) || { name: selectedBalanceProvider, icon: '⚡' };
            const pConfig = customProviders[selectedBalanceProvider] || meta;

            return (
              <div className="admin-card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '14px',
                  borderBottom: '1px solid var(--admin-border-glass)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px' }}>{meta.icon}</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                        {meta.name} — API Key Vault ({keysList.length} Keys)
                      </h3>
                      {activeProvider === selectedBalanceProvider && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: '#ff4f00',
                          color: '#fff'
                        }}>
                          PRIMARY PROVIDER
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
                      Inspect real-time API credit balance, rotate keys, add new keys, or delete exhausted keys.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={checkingAll || keysList.length === 0}
                      onClick={() => handleCheckAllBalancesForProvider(selectedBalanceProvider)}
                      className="admin-btn admin-btn-sm"
                      style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontWeight: 800 }}
                    >
                      {checkingAll ? 'Checking All Keys...' : '⚡ Check All Keys Balance'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddKeyModal(true)}
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      style={{ fontWeight: 800 }}
                    >
                      ➕ Add Keys to {meta.name}
                    </button>
                  </div>
                </div>

                {/* Balance Endpoint Info */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--admin-border-glass)',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--admin-text-sub)' }}>Balance Checking Endpoint: </span>
                    <strong style={{ color: '#06b6d4', fontFamily: 'monospace' }}>
                      {pConfig.balanceUrl || (selectedBalanceProvider === 'kie.ai' ? 'https://api.kie.ai/api/v1/chat/credit' : 'Auth Verification Ping')}
                    </strong>
                    {pConfig.balanceValuePath && (
                      <span style={{ color: 'var(--admin-text-sub)', marginLeft: '8px' }}>
                        (Path: <code style={{ color: '#ff4f00' }}>{pConfig.balanceValuePath}</code>)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEditProvider(selectedBalanceProvider)}
                    className="admin-btn admin-btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    ⚙️ Edit Balance Endpoint
                  </button>
                </div>

                {keysList.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                    No API keys in vault for {meta.name}. Click "➕ Add Keys" above to populate the rotation pool.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--admin-border-glass)', fontSize: '11px', color: 'var(--admin-text-sub)', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 12px' }}>Slot</th>
                          <th style={{ padding: '10px 12px' }}>API Key</th>
                          <th style={{ padding: '10px 12px' }}>Live Credit Balance</th>
                          <th style={{ padding: '10px 12px' }}>Health Status</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keysList.map((key, idx) => {
                          const isRevealed = revealedKeys[key];
                          const bInfo = keyBalances[key];
                          const isChecking = checkingKey[key];

                          let statusColor = '#94a3b8';
                          let statusLabel = 'Unchecked';
                          if (bInfo) {
                            if (bInfo.status === 'active') {
                              statusColor = '#10b981';
                              statusLabel = 'ACTIVE';
                            } else if (bInfo.status === 'low') {
                              statusColor = '#f59e0b';
                              statusLabel = 'LOW BALANCE';
                            } else if (bInfo.status === 'exhausted') {
                              statusColor = '#ef4444';
                              statusLabel = 'EXHAUSTED';
                            } else if (bInfo.status === 'invalid') {
                              statusColor = '#ef4444';
                              statusLabel = 'INVALID KEY';
                            }
                          }

                          return (
                            <tr key={key} style={{ borderBottom: '1px solid var(--admin-border-glass)', fontSize: '12.5px' }}>
                              <td style={{ padding: '12px', color: 'var(--admin-text-sub)', fontWeight: 700 }}>
                                #{idx + 1}
                              </td>

                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                    {isRevealed ? key : `${key.slice(0, 5)}••••••••••••${key.slice(-4)}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedKeys(prev => ({ ...prev, [key]: !prev[key] }))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-sub)', cursor: 'pointer', fontSize: '11px' }}
                                    title={isRevealed ? 'Mask key' : 'Reveal key'}
                                  >
                                    {isRevealed ? '👁️‍🗨️' : '👁️'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(key);
                                      alert('API key copied to clipboard!');
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-sub)', cursor: 'pointer', fontSize: '11px' }}
                                    title="Copy key"
                                  >
                                    📋
                                  </button>
                                </div>
                              </td>

                              <td style={{ padding: '12px' }}>
                                {isChecking ? (
                                  <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 700 }}>Checking balance...</span>
                                ) : bInfo ? (
                                  <div>
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: 800,
                                      color: bInfo.balance > 0 ? '#10b981' : (bInfo.status === 'active' ? '#10b981' : '#ef4444')
                                    }}>
                                      {bInfo.balanceFormatted}
                                    </div>
                                    {bInfo.details && (
                                      <div style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)' }}>
                                        {bInfo.details}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>Not checked yet</span>
                                )}
                              </td>

                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '5px',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  background: `${statusColor}22`,
                                  color: statusColor,
                                  border: `1px solid ${statusColor}44`
                                }}>
                                  {statusLabel}
                                </span>
                              </td>

                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    disabled={isChecking}
                                    onClick={() => handleCheckKeyBalance(selectedBalanceProvider, key)}
                                    className="admin-btn admin-btn-sm"
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                  >
                                    {isChecking ? '...' : '⚡ Check'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKeyFromProvider(selectedBalanceProvider, key)}
                                    className="admin-btn admin-btn-sm admin-btn-danger"
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                    title="Delete this key"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: VISION MODELS & CREDITS MATRIX
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar */}
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search models..."
                value={modelSearch}
                onChange={e => setModelSearch(e.target.value)}
                className="admin-input"
                style={{ width: '220px', fontSize: '12.5px' }}
              />

              <div style={{ display: 'flex', gap: '4px', background: 'var(--admin-bg-elevated)', padding: '3px', borderRadius: '8px' }}>
                {['all', 'text-to-image', 'image-to-image'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setModelTypeFilter(t)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: modelTypeFilter === t ? '#ff4f00' : 'transparent',
                      color: modelTypeFilter === t ? '#fff' : 'var(--admin-text-sub)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t === 'all' ? 'All Types' : t === 'text-to-image' ? 'Text-to-Image' : 'Image-to-Image'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="admin-btn admin-btn-primary"
              style={{ fontWeight: 800 }}
            >
              ➕ Add Vision Model
            </button>
          </div>

          {/* Model Cards Grid */}
          <div className="admin-grid admin-grid-2" style={{ gap: '16px' }}>
            {filteredModels.map(m => {
              const resCredits = m.creditsByResolution || { '1K': 6, '2K': 10, '4K': 16 };

              return (
                <div
                  key={m.id}
                  className="admin-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--admin-border-glass)',
                    opacity: m.enabled === false ? 0.6 : 1
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                            {m.name}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '5px',
                            fontSize: '10px',
                            fontWeight: 800,
                            background: m.badgeColor || 'linear-gradient(135deg, #10b981, #06b6d4)',
                            color: '#fff'
                          }}>
                            {m.badge || 'PRO'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontFamily: 'monospace', marginTop: '2px' }}>
                          ID: {m.id} · Type: {m.type}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateModelField(m.id, 'enabled', !m.enabled)}
                          className="admin-btn admin-btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            background: m.enabled !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: m.enabled !== false ? '#10b981' : '#ef4444'
                          }}
                        >
                          {m.enabled !== false ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModel(m.id)}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Provider & Slug Mapping Inputs */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '10px',
                      borderRadius: '8px',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                          Target Provider:
                        </label>
                        <select
                          value={m.provider || 'kie.ai'}
                          onChange={e => handleUpdateModelField(m.id, 'provider', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '11.5px', padding: '4px 6px' }}
                        >
                          {providersList.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                          Provider Model Slug:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. gpt-image/2.5-flare"
                          value={m.providerModelId || ''}
                          onChange={e => handleUpdateModelField(m.id, 'providerModelId', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '11px', padding: '4px 6px', fontFamily: 'monospace' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                          Fallback Model Slug:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. flux-schnell"
                          value={m.fallbackModelId || ''}
                          onChange={e => handleUpdateModelField(m.id, 'fallbackModelId', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '11px', padding: '4px 6px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', lineHeight: 1.4, marginBottom: '12px' }}>
                      {m.description}
                    </div>

                    {/* Showcase Image with Live Preview */}
                    <div style={{ marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{
                        width: '72px',
                        height: '46px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#000',
                        border: '1px solid var(--admin-border-glass)',
                        flexShrink: 0
                      }}>
                        <img
                          src={m.showcaseImage}
                          alt={m.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                          Showcase Preview Image URL:
                        </label>
                        <input
                          type="text"
                          value={m.showcaseImage || ''}
                          onChange={e => handleUpdateModelField(m.id, 'showcaseImage', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '11.5px', padding: '5px 8px' }}
                        />
                      </div>
                    </div>

                    {/* Granular Credits Matrix */}
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--admin-border-glass)'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff4f00', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Credit Cost Per Quality Tier:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>1K Standard</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={resCredits['1K'] ?? 6}
                            onChange={e => handleUpdateModelCredits(m.id, '1K', e.target.value)}
                            className="admin-input"
                            style={{ fontSize: '12px', padding: '5px 8px', fontWeight: 800 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>2K High-Def</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={resCredits['2K'] ?? 10}
                            onChange={e => handleUpdateModelCredits(m.id, '2K', e.target.value)}
                            className="admin-input"
                            style={{ fontSize: '12px', padding: '5px 8px', fontWeight: 800 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>4K Ultra</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={resCredits['4K'] ?? 16}
                            onChange={e => handleUpdateModelCredits(m.id, '4K', e.target.value)}
                            className="admin-input"
                            style={{ fontSize: '12px', padding: '5px 8px', fontWeight: 800 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Per-Model Endpoint Override ── */}
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>⚡ Model-Specific Endpoint Override</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)' }}>{m.endpointOverride?.enabled ? 'Override ON' : 'Use Provider Default'}</span>
                          <input type="checkbox" checked={Boolean(m.endpointOverride?.enabled)} onChange={e => handleUpdateModelField(m.id, 'endpointOverride', { ...(m.endpointOverride || {}), enabled: e.target.checked })} style={{ accentColor: '#6366f1', width: '14px', height: '14px' }} />
                        </label>
                      </div>
                      {m.endpointOverride?.enabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* 1-Click Endpoint Templates */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '2px' }}>
                            {[
                              { label: '🌐 OpenAI Sync', fmt: 'openai', method: 'POST', url: 'https://api.openai.com/v1/images/generations' },
                              { label: '🚀 Fal Queue', fmt: 'fal', method: 'POST', url: `https://queue.fal.run/${m.providerModelId || m.id}` },
                              { label: '🔄 Replicate', fmt: 'replicate', method: 'POST', url: `https://api.replicate.com/v1/models/${m.providerModelId || m.id}/predictions` },
                              { label: '⚡ Kie.ai', fmt: 'kie', method: 'POST', url: 'https://api.kie.ai/api/v1/jobs/createTask' },
                              { label: '⚙️ Custom', fmt: 'custom', method: 'POST', url: '' }
                            ].map(tpl => (
                              <button
                                key={tpl.label}
                                type="button"
                                className="admin-btn admin-btn-sm"
                                style={{ fontSize: '9.5px', padding: '2px 6px' }}
                                onClick={() => handleUpdateModelField(m.id, 'endpointOverride', {
                                  ...(m.endpointOverride || {}),
                                  enabled: true,
                                  generateMethod: tpl.method,
                                  payloadFormat: tpl.fmt,
                                  generateUrl: tpl.url || m.endpointOverride?.generateUrl || ''
                                })}
                              >
                                {tpl.label}
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px' }}>
                            <div>
                              <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Method:</label>
                              <select value={m.endpointOverride?.generateMethod || 'POST'} onChange={e => handleUpdateModelField(m.id, 'endpointOverride', { ...(m.endpointOverride || {}), generateMethod: e.target.value })} className="admin-input" style={{ width: '100%', fontSize: '11px' }}>
                                <option value="POST">POST</option><option value="GET">GET</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Custom Generation URL:</label>
                              <input type="text" placeholder="https://api.example.com/model-specific-endpoint" value={m.endpointOverride?.generateUrl || ''} onChange={e => handleUpdateModelField(m.id, 'endpointOverride', { ...(m.endpointOverride || {}), generateUrl: e.target.value })} className="admin-input" style={{ width: '100%', fontSize: '11px', fontFamily: 'monospace' }} />
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Payload Format:</label>
                            <select value={m.endpointOverride?.payloadFormat || 'openai'} onChange={e => handleUpdateModelField(m.id, 'endpointOverride', { ...(m.endpointOverride || {}), payloadFormat: e.target.value })} className="admin-input" style={{ fontSize: '11px', width: '160px' }}>
                              <option value="openai">OpenAI Compatible</option><option value="kie">Kie.ai Format</option><option value="fal">Fal.ai Queue</option><option value="replicate">Replicate</option><option value="custom">Custom JSON Template</option>
                            </select>
                          </div>
                          {m.endpointOverride?.payloadFormat === 'custom' && (
                            <div>
                              <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Custom Payload Template (use {'{{prompt}}'}, {'{{model}}'}, {'{{width}}'}, {'{{height}}'}):</label>
                              <textarea rows={4} value={m.endpointOverride?.customPayloadTemplate || '{\n  "prompt": "{{prompt}}",\n  "model": "{{model}}"\n}'} onChange={e => handleUpdateModelField(m.id, 'endpointOverride', { ...(m.endpointOverride || {}), customPayloadTemplate: e.target.value })} className="admin-input" style={{ width: '100%', fontSize: '11px', fontFamily: 'monospace', resize: 'vertical' }} />
                            </div>
                          )}
                          <p style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
                            💡 This endpoint will be used exclusively for this model, overriding the provider's default generation URL.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: SYSTEM PROMPT & RULES
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'system_prompt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                  Autonomous System Prompt & Instruction Conditioning
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
                  By default, <strong>no system prompt overrides user prompts</strong>. System prompt conditioning will only activate when explicitly turned ON below.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: systemPromptEnabled ? '#10b981' : 'var(--admin-text-sub)' }}>
                  {systemPromptEnabled ? 'SYSTEM PROMPT ACTIVE' : 'OFF (DISABLED)'}
                </span>
                <input
                  type="checkbox"
                  checked={systemPromptEnabled}
                  onChange={e => setSystemPromptEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff4f00' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                System Prompt (Prepended before user generation prompt):
              </label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Leave blank or enter instructions to condition image compositions..."
                className="admin-input"
                style={{ width: '100%', fontFamily: 'inherit', lineHeight: 1.5, fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Default Negative Prompt:
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="--no watermark, no blur, no low resolution, no deformed faces"
                className="admin-input"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 5: VIRAL PRESETS (1-CLICK TEMPLATES)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'presets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                1-Click Viral Creator Presets ({presets.length})
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
                Manage 1-click preset templates displayed in the frontend Thumbnail Studio dropdown.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPresetModal(true)}
              className="admin-btn admin-btn-primary"
              style={{ fontWeight: 800 }}
            >
              ➕ Add Preset
            </button>
          </div>

          <div className="admin-grid admin-grid-2" style={{ gap: '14px' }}>
            {presets.map(p => (
              <div key={p.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{p.emoji || '🔥'}</span>
                    <strong style={{ fontSize: '14px', color: 'var(--admin-text-main)' }}>{p.label}</strong>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#ff4f00', color: '#fff', fontWeight: 800 }}>
                      {p.aspectRatio || '16:9'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(p.id)}
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    🗑️
                  </button>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontFamily: 'monospace' }}>
                  ID: {p.id} · Model: {p.modelId || 'Default'}
                </div>

                <textarea
                  rows={3}
                  value={p.prompt}
                  onChange={e => handleUpdatePresetField(p.id, 'prompt', e.target.value)}
                  className="admin-input"
                  style={{ fontSize: '12px', lineHeight: 1.4 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 6: LIVE DIAGNOSTICS & REAL TEST
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'diagnostics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
              ⚡ Real Test Generation Suite
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '0 0 16px 0' }}>
              Executes a real image generation dispatch to verify endpoint configuration, API key rotation, and output rendering.
            </p>

            <form onSubmit={handleRunRealTest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Provider to Test:
                  </label>
                  <select
                    value={testProvider}
                    onChange={e => setTestProvider(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  >
                    {providersList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Aspect Ratio:
                  </label>
                  <select
                    value={testRatio}
                    onChange={e => setTestRatio(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  >
                    <option value="16:9">16:9 (Landscape YouTube)</option>
                    <option value="9:16">9:16 (Vertical Shorts)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:3">4:3 (Standard)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Resolution:
                  </label>
                  <select
                    value={testRes}
                    onChange={e => setTestRes(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  >
                    <option value="1K">1K Standard</option>
                    <option value="2K">2K High-Def</option>
                    <option value="4K">4K Ultra-Fine</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Test Prompt:
                </label>
                <textarea
                  rows={3}
                  value={testPrompt}
                  onChange={e => setTestPrompt(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                disabled={testing}
                className="admin-btn admin-btn-primary"
                style={{ alignSelf: 'flex-start', fontWeight: 800 }}
              >
                {testing ? '⚡ Executing Test Generation...' : '🚀 Run Real Generation Test'}
              </button>
            </form>

            {testError && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '13px' }}>
                <strong>Test Error:</strong> {testError}
              </div>
            )}

            {testResult && (
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
                  ✓ Test Generation Succeeded! (Duration: {testResult.costTime}s)
                </div>
                {testResult.imageUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={testResult.imageUrl}
                      alt="Test Render"
                      style={{ maxWidth: '440px', borderRadius: '8px', border: '1px solid var(--admin-border-glass)' }}
                    />
                    <div style={{ fontSize: '11px', color: '#06b6d4', marginTop: '6px', fontFamily: 'monospace' }}>
                      Output URL: {testResult.imageUrl}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 7: REAL-TIME ACTIVITY & GENERATION LOGS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                    Real-Time Thumbnail Studio Activity Logs
                  </h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 800,
                    background: autoRefreshLogs ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: autoRefreshLogs ? '#10b981' : '#ef4444'
                  }}>
                    {autoRefreshLogs ? '🟢 LIVE AUTO-REFRESH (3s)' : 'PAUSED'}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
                  Live feed of user generations, API key rotations, provider failovers, task creations, and error codes.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--admin-text-sub)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoRefreshLogs}
                    onChange={e => setAutoRefreshLogs(e.target.checked)}
                    style={{ accentColor: '#ff4f00' }}
                  />
                  <span>Auto-Refresh</span>
                </label>

                <button
                  type="button"
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  className="admin-btn admin-btn-sm"
                  style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', color: '#06b6d4', fontWeight: 800 }}
                >
                  {loadingLogs ? 'Refreshing...' : '🔄 Refresh Now'}
                </button>

                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="admin-btn admin-btn-sm admin-btn-danger"
                  style={{ fontWeight: 800 }}
                >
                  🗑️ Clear All Logs
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Events (${logs.length})` },
                { id: 'success', label: 'Completions (Success)' },
                { id: 'rotations', label: 'Key Rotations & Failovers' },
                { id: 'errors', label: 'Errors & Exhaustions' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLogFilter(f.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: logFilter === f.id ? '#ff4f00' : 'var(--admin-bg-elevated)',
                    color: logFilter === f.id ? '#fff' : 'var(--admin-text-sub)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Logs List Table */}
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                No activity logs recorded yet. Execute a thumbnail generation in the studio to watch real-time events appear!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border-glass)', fontSize: '11px', color: 'var(--admin-text-sub)', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                      <th style={{ padding: '10px 12px' }}>Event Type</th>
                      <th style={{ padding: '10px 12px' }}>Provider & Model</th>
                      <th style={{ padding: '10px 12px' }}>Key Slot</th>
                      <th style={{ padding: '10px 12px' }}>Details / Prompt / Error</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Result Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((item, idx) => {
                      const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now';
                      let badgeColor = '#06b6d4';
                      let badgeBg = 'rgba(6, 182, 212, 0.15)';
                      if (item.type === 'GENERATION_SUCCESS' || item.type === 'TASK_COMPLETED') {
                        badgeColor = '#10b981';
                        badgeBg = 'rgba(16, 185, 129, 0.15)';
                      } else if (item.type?.includes('FAIL') || item.type?.includes('ERROR') || item.type?.includes('EXHAUST')) {
                        badgeColor = '#ef4444';
                        badgeBg = 'rgba(239, 68, 68, 0.15)';
                      } else if (item.type === 'PROVIDER_FAILOVER') {
                        badgeColor = '#a855f7';
                        badgeBg = 'rgba(168, 85, 247, 0.15)';
                      } else if (item.type?.includes('ROTATE')) {
                        badgeColor = '#f59e0b';
                        badgeBg = 'rgba(245, 158, 11, 0.15)';
                      }

                      return (
                        <tr key={item._id || idx} style={{ borderBottom: '1px solid var(--admin-border-glass)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--admin-text-sub)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {timeStr}
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              background: badgeBg,
                              color: badgeColor,
                              border: `1px solid ${badgeColor}33`,
                              whiteSpace: 'nowrap'
                            }}>
                              {item.type}
                            </span>
                          </td>

                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#ff4f00' }}>{item.provider || item.failedProvider || 'kie.ai'}</strong>
                            {item.model && <span style={{ color: 'var(--admin-text-sub)', marginLeft: '4px' }}>({item.model})</span>}
                          </td>

                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--admin-text-sub)', whiteSpace: 'nowrap' }}>
                            {item.keyMasked || '—'}
                          </td>

                          <td style={{ padding: '10px 12px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.error ? (
                              <span style={{ color: '#ef4444', fontWeight: 600 }}>Error: {item.error}</span>
                            ) : item.message ? (
                              <span style={{ color: 'var(--admin-text-main)' }}>{item.message}</span>
                            ) : item.promptSnippet ? (
                              <span style={{ color: 'var(--admin-text-sub)' }}>Prompt: "{item.promptSnippet}"</span>
                            ) : (
                              <span style={{ color: 'var(--admin-text-sub)' }}>{item.targetUrl || item.taskId || 'Activity event'}</span>
                            )}
                            {item.durationMs && (
                              <span style={{ fontSize: '10px', color: '#06b6d4', marginLeft: '6px' }}>({item.durationMs}ms)</span>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {item.resultUrl ? (
                              <a
                                href={item.resultUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#10b981',
                                  fontWeight: 700,
                                  textDecoration: 'none'
                                }}
                              >
                                <img
                                  src={item.resultUrl}
                                  alt="Thumb"
                                  style={{ width: '28px', height: '18px', borderRadius: '3px', objectFit: 'cover', background: '#000' }}
                                />
                                <span>View ↗</span>
                              </a>
                            ) : (
                              <span style={{ color: 'var(--admin-text-sub)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 8: AI PROVIDER ARCHITECT (INTELLIGENT CONFIGURATOR)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'ai_architect' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* API Key input for the architect to use */}
          <div className="admin-card" style={{ padding: '14px 18px', borderLeft: '3px solid #ff4f00' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  New Provider API Key (optional — for testing & auto-vault):
                </label>
                <input
                  type="password"
                  value={architectApiKey}
                  onChange={e => setArchitectApiKey(e.target.value)}
                  placeholder="Paste your API key here — it will be saved to vault when you apply"
                  className="admin-input"
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '14px' }}>
                <button type="button" className="admin-btn" style={{ fontSize: '11px', background: 'rgba(255,79,0,0.1)', borderColor: '#ff4f00', color: '#ff4f00' }} onClick={() => { setArchitectMessages([{ role: 'assistant', content: JSON.stringify({ reply: "👋 Hello! I'm the **Bang AI Provider Architect**. Paste API docs, a cURL example, or just describe the provider you want to add. I'll extract and test the full configuration for you!", action: 'need_more_info', extractedConfig: null, confidence: 100 }) }]); setArchitectInput(''); setArchitectError(null); setPendingConfig(null); }}>
                  🔄 Reset Chat
                </button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--admin-border-glass)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)' }}>Bang AI Provider Architect</div>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Powered by Google Gemini 3.8 Flash • Live Web Search & Doc Browsing Active • Key-rotated engine</div>
              </div>
              <div style={{ marginLeft: 'auto', padding: '3px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '5px', fontSize: '10px', fontWeight: 800 }}>
                ONLINE
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={architectChatRef} style={{ maxHeight: '460px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {architectMessages.map((msg, idx) => {
                let parsed = null;
                if (msg.role === 'assistant') {
                  try { parsed = JSON.parse(msg.content); } catch {}
                }
                const displayText = parsed?.reply || msg.content;

                return (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: msg.role === 'user' ? '#ff4f00' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div style={{ maxWidth: '80%', background: msg.role === 'user' ? 'rgba(255,79,0,0.12)' : 'rgba(255,255,255,0.04)', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', padding: '10px 14px', border: `1px solid ${msg.role === 'user' ? 'rgba(255,79,0,0.25)' : 'var(--admin-border-glass)'}` }}>
                      <p style={{ fontSize: '12.5px', color: 'var(--admin-text-main)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{displayText}</p>

                      {/* ── Executed Action Live Results Card ── */}
                      {parsed?.executed && (
                        <div style={{
                          marginTop: '10px',
                          padding: '10px 14px',
                          background: parsed.executed.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          borderRadius: '8px',
                          border: `1px solid ${parsed.executed.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: parsed.executed.success ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                              ⚡ {parsed.executed.action}: {parsed.executed.success ? 'EXECUTED' : 'FAILED'}
                            </span>
                            {parsed.executed.success && (
                              <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '9px', fontWeight: 800 }}>
                                LIVE ATLS SYNCED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--admin-text-main)', lineHeight: 1.4 }}>
                            {parsed.executed.message || parsed.executed.error}
                          </div>

                          {/* Live Rendered Test Image Preview */}
                          {parsed.executed.imageUrl && (
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ width: '100%', maxWidth: '360px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border-glass)', background: '#000' }}>
                                <img
                                  src={parsed.executed.imageUrl}
                                  alt="Live Test Render"
                                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                                />
                              </div>
                              <a
                                href={parsed.executed.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span>View Full 4K Thumbnail in New Window</span>
                                <span>↗</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Config Proposal Card (ONLY if show_config or unexecuted proposed config) */}
                      {parsed?.extractedConfig && !parsed?.executed && (
                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>
                              {parsed.extractedConfig.icon || '⚡'} Proposed Provider Configuration
                              {parsed.confidence > 0 && <span style={{ marginLeft: '8px', color: parsed.confidence >= 80 ? '#10b981' : '#f59e0b' }}>• {parsed.confidence}% confidence</span>}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 10px', marginBottom: '10px' }}>
                            {[['ID', parsed.extractedConfig.id], ['Name', parsed.extractedConfig.name], ['Mode', parsed.extractedConfig.mode], ['Auth', parsed.extractedConfig.authHeaderType], ['Gen URL', parsed.extractedConfig.generateUrl], ['Payload', parsed.extractedConfig.payloadFormat]].map(([k, v]) => v && (
                              <div key={k} style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)' }}><span style={{ color: 'var(--admin-text-main)', fontWeight: 700 }}>{k}:</span> <span style={{ fontFamily: 'monospace' }}>{v}</span></div>
                            ))}
                          </div>
                          {parsed.extractedModels?.length > 0 && (
                            <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                              Models found: {parsed.extractedModels.map(m => <span key={m.id} style={{ display: 'inline-block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '4px', padding: '1px 6px', margin: '2px', fontFamily: 'monospace', fontSize: '10px', color: '#6366f1' }}>{m.id}</span>)}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button type="button" className="admin-btn admin-btn-sm" style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', borderColor: '#10b981', color: '#10b981' }} onClick={() => handleArchitectApply(parsed.extractedConfig, false)} disabled={applyingConfig}>
                              {applyingConfig ? '⏳ Applying...' : '✅ Save Provider Config'}
                            </button>
                            <button type="button" className="admin-btn admin-btn-sm" style={{ fontSize: '11px', background: 'rgba(255,79,0,0.15)', borderColor: '#ff4f00', color: '#ff4f00' }} onClick={() => handleArchitectApply(parsed.extractedConfig, true)} disabled={applyingConfig}>
                              {applyingConfig ? '⏳...' : '⭐ Apply & Set as Primary'}
                            </button>
                            <button type="button" className="admin-btn admin-btn-sm" style={{ fontSize: '11px' }} onClick={() => { const rawStr = JSON.stringify(parsed.extractedConfig, null, 2); setArchitectInput(`Here's the config I want you to verify and correct if needed:\n\`\`\`json\n${rawStr}\n\`\`\``); }}>
                              ✏️ Refine Config
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {architectLoading && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🤖</div>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px 14px 14px 14px', border: '1px solid var(--admin-border-glass)' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', animation: `pulse ${0.6 + i * 0.15}s ease-in-out infinite alternate` }} />)}
                      <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginLeft: '6px' }}>Analyzing API documentation...</span>
                    </div>
                  </div>
                </div>
              )}
              {architectError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '12px', color: '#ef4444' }}>❌ {architectError}</div>}
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--admin-border-glass)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={architectInput}
                onChange={e => setArchitectInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleArchitectSend(); } }}
                placeholder={'Describe the provider or paste API docs / cURL here...\nExamples:\n• "Add Ideogram AI — their API endpoint is https://api.ideogram.ai/generate"\n• Paste a cURL example with the full endpoint and headers\n• "Configure Stability AI with key: sk-xxx..."'}
                className="admin-input"
                rows={3}
                style={{ flex: 1, fontSize: '12.5px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleArchitectSend} disabled={architectLoading || !architectInput.trim()} style={{ padding: '10px 20px', flexShrink: 0, fontWeight: 800 }}>
                {architectLoading ? '⏳' : '📤 Send'}
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="admin-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', marginBottom: '10px' }}>Quick Prompts:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: '⚡ Configure Fal.ai', prompt: 'I want to add Fal.ai as a provider. Their API uses Authorization: Key <KEY>, the generation endpoint for FLUX Schnell is POST https://queue.fal.run/fal-ai/flux/schnell. It is async — returns request_id, polling URL is https://queue.fal.run/fal-ai/flux/schnell/requests/{request_id}/status and completed when status == "COMPLETED", result at images[0].url.' },
                { label: '🎨 Configure Ideogram', prompt: 'Configure Ideogram AI. API endpoint: POST https://api.ideogram.ai/generate. Headers: Api-Key: <KEY>. It is synchronous and returns images[0].url. The models are ideogram-v2 and ideogram-v2-turbo. Balance check: GET https://api.ideogram.ai/manage/api/account returns credit_balance.' },
                { label: '🔵 Configure Stability AI', prompt: 'Add Stability AI. Endpoint: POST https://api.stability.ai/v2beta/stable-image/generate/ultra. Auth: Authorization: Bearer <KEY>. It returns a base64 image directly in the response body. The model is stable-ultra.' },
                { label: '🟢 OpenAI Compatible', prompt: 'I have a custom OpenAI-compatible API at https://my-custom-api.com/v1/images/generations. It uses Bearer auth and returns data[0].url. Set it up as "My Custom API".' },
                { label: '🔄 Configure Replicate', prompt: 'Configure Replicate API. Auth: Bearer. Endpoint is POST https://api.replicate.com/v1/models/{owner}/{model}/predictions. It is async — returns id, poll at GET https://api.replicate.com/v1/predictions/{id}, succeeded when status == "succeeded", image at output[0].' }
              ].map(q => (
                <button key={q.label} type="button" className="admin-btn admin-btn-sm" style={{ fontSize: '11px' }} onClick={() => setArchitectInput(q.prompt)}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Model Importer Section */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>📡 Models Discovery & Bulk Importer</h3>
                <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0 }}>Fetch a provider's full model catalog from their /v1/models endpoint and bulk-import them into Thumbnail Studio.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>Provider:</label>
                <select value={importerProvider} onChange={e => setImporterProvider(e.target.value)} className="admin-input" style={{ width: '100%', fontSize: '12px' }}>
                  {providersList.map(p => <option key={p.id} value={p.id}>{p.icon || '🌐'} {p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>Auth Type:</label>
                <select value={importerAuth} onChange={e => setImporterAuth(e.target.value)} className="admin-input" style={{ width: '100%', fontSize: '12px' }}>
                  <option value="Bearer">Bearer</option>
                  <option value="Key">Key (Fal.ai)</option>
                  <option value="Token">Token</option>
                  <option value="x-api-key">x-api-key</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>Credits 1K / 2K / 4K:</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['1K', '2K', '4K'].map(r => (
                    <input key={r} type="number" min="0" value={importerCredits[r]} onChange={e => setImporterCredits(prev => ({ ...prev, [r]: Number(e.target.value) }))} className="admin-input" style={{ width: '50px', fontSize: '11px', padding: '5px 6px', textAlign: 'center' }} placeholder={r} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>Models Listing URL:</label>
                <input type="text" value={importerUrl} onChange={e => setImporterUrl(e.target.value)} placeholder="e.g. https://api.together.xyz/v1/models" className="admin-input" style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>Response Path (optional):</label>
                <input type="text" value={importerPath} onChange={e => setImporterPath(e.target.value)} placeholder="e.g. data or models" className="admin-input" style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>API Key for fetching (uses vault key if blank):</label>
              <input type="password" value={importerApiKey} onChange={e => setImporterApiKey(e.target.value)} placeholder="Leave blank to use a key from the provider's vault" className="admin-input" style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleFetchImporterModels} disabled={importerLoading} style={{ fontWeight: 800 }}>
                {importerLoading ? '⏳ Fetching...' : '📡 Fetch Models from Endpoint'}
              </button>
              {importerModels.length > 0 && (
                <button type="button" className="admin-btn" style={{ fontSize: '12px' }} onClick={() => { setImporterSelected(new Set(importerModels.filter(m => m.id.toLowerCase().includes(importerFilter.toLowerCase()) || !importerFilter).map(m => m.id))); }}>
                  ✅ Select All Visible
                </button>
              )}
              {importerSelected.size > 0 && (
                <button type="button" className="admin-btn admin-btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', border: 'none', fontWeight: 800 }} onClick={handleBulkImportModels}>
                  ⬇️ Import Selected ({importerSelected.size})
                </button>
              )}
            </div>

            {importerError && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>❌ {importerError}</div>}
            {importerSuccess && <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontSize: '12px', color: '#10b981', marginBottom: '12px' }}>✅ {importerSuccess}</div>}

            {importerModels.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input type="text" value={importerFilter} onChange={e => setImporterFilter(e.target.value)} placeholder="🔍 Filter models by name or ID..." className="admin-input" style={{ flex: 1, fontSize: '12px' }} />
                  <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)', whiteSpace: 'nowrap' }}>{importerModels.filter(m => !importerFilter || m.id.toLowerCase().includes(importerFilter.toLowerCase()) || m.name.toLowerCase().includes(importerFilter.toLowerCase())).length} models</span>
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--admin-border-glass)', borderRadius: '8px' }}>
                  {importerModels.filter(m => !importerFilter || m.id.toLowerCase().includes(importerFilter.toLowerCase()) || m.name.toLowerCase().includes(importerFilter.toLowerCase())).map(m => (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: '1px solid var(--admin-border-glass)', cursor: 'pointer', background: importerSelected.has(m.id) ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'background 0.1s' }}>
                      <input type="checkbox" checked={importerSelected.has(m.id)} onChange={e => { const next = new Set(importerSelected); e.target.checked ? next.add(m.id) : next.delete(m.id); setImporterSelected(next); }} style={{ accentColor: '#ff4f00', width: '14px', height: '14px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.id}</div>
                        {m.name !== m.id && <div style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)' }}>{m.name}</div>}
                        {m.description && <div style={{ fontSize: '10px', color: 'var(--admin-text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</div>}
                      </div>
                      {m.type && <span style={{ fontSize: '9px', padding: '1px 5px', background: 'rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}>{m.type}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT SERVICE PROVIDER SPECIFICATIONS ─────────── */}
      {showProviderModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--admin-bg-card)',
            border: '1px solid var(--admin-border-glass)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                {providerModalMode === 'edit' ? `✏️ Edit Provider: ${providerForm.name}` : '➕ Add Custom Service Provider'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProviderModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-sub)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* 1-Click Architecture Templates */}
            <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--admin-border-glass)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff4f00', textTransform: 'uppercase', marginBottom: '6px' }}>
                1-Click Quick Template Presets:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'openai', label: '🌐 OpenAI Compatible (DALL-E)' },
                  { id: 'kie', label: '⚡ Kie.ai Async Task' },
                  { id: 'together', label: '🧠 Together AI Sync' },
                  { id: 'fal', label: '🚀 Fal.ai Queue' },
                  { id: 'replicate', label: '🔄 Replicate Predictions' }
                ].map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl.id)}
                    className="admin-btn admin-btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveProviderModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Core Identity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 80px', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Provider ID (slug):
                  </label>
                  <input
                    type="text"
                    required
                    disabled={providerModalMode === 'edit'}
                    placeholder="e.g. ideogram"
                    value={providerForm.id}
                    onChange={e => setProviderForm({ ...providerForm, id: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12.5px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Display Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ideogram AI"
                    value={providerForm.name}
                    onChange={e => setProviderForm({ ...providerForm, name: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Emoji:
                  </label>
                  <input
                    type="text"
                    value={providerForm.icon || '⚡'}
                    onChange={e => setProviderForm({ ...providerForm, icon: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '16px', textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* Mode & Auth Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Execution Mode:
                  </label>
                  <select
                    value={providerForm.mode || 'sync'}
                    onChange={e => setProviderForm({ ...providerForm, mode: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    <option value="sync">⚡ Direct Synchronous (Returns image URL immediately)</option>
                    <option value="async">⏳ Asynchronous Task (Returns Task ID & Polls)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Authentication Header Type:
                  </label>
                  <select
                    value={providerForm.authHeaderType || 'Bearer'}
                    onChange={e => setProviderForm({ ...providerForm, authHeaderType: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    <option value="Bearer">Authorization: Bearer &lt;KEY&gt;</option>
                    <option value="Key">Authorization: Key &lt;KEY&gt; (Fal.ai)</option>
                    <option value="Token">Authorization: Token &lt;KEY&gt;</option>
                    <option value="x-api-key">x-api-key: &lt;KEY&gt;</option>
                    <option value="Custom">Custom Header</option>
                  </select>
                </div>
              </div>

              {providerForm.authHeaderType === 'Custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Custom Header Name:
                    </label>
                    <input
                      type="text"
                      placeholder="X-API-KEY"
                      value={providerForm.customHeaderName || ''}
                      onChange={e => setProviderForm({ ...providerForm, customHeaderName: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Prefix (if any):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bearer "
                      value={providerForm.authPrefix || ''}
                      onChange={e => setProviderForm({ ...providerForm, authPrefix: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}

              {/* Generation Endpoint Settings */}
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--admin-border-glass)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#06b6d4', marginBottom: '10px' }}>
                  1. Generation Endpoint & Payload Configuration
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Method:</label>
                    <select
                      value={providerForm.generateMethod || 'POST'}
                      onChange={e => setProviderForm({ ...providerForm, generateMethod: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Generation Endpoint URL (Supports <code style={{ color: '#ff4f00' }}>{'{{model}}'}</code>):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://api.provider.com/v1/images/generations"
                      value={providerForm.generateUrl || ''}
                      onChange={e => setProviderForm({ ...providerForm, generateUrl: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Payload Request Format:
                    </label>
                    <select
                      value={providerForm.payloadFormat || 'openai'}
                      onChange={e => setProviderForm({ ...providerForm, payloadFormat: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      <option value="openai">OpenAI Format (model, prompt, size, n)</option>
                      <option value="kie">Kie.ai Format (model, input: &#123; prompt, aspect_ratio, resolution &#125;)</option>
                      <option value="fal">Fal.ai Format (prompt, image_size, num_inference_steps)</option>
                      <option value="replicate">Replicate Format (input: &#123; prompt, aspect_ratio &#125;)</option>
                      <option value="custom">Custom JSON Payload Template</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Response Image URL JSON Path:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. data[0].url, output[0], images[0].url"
                      value={providerForm.responseImageUrlPath || ''}
                      onChange={e => setProviderForm({ ...providerForm, responseImageUrlPath: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              {/* Asynchronous Polling Settings (if mode === 'async') */}
              {providerForm.mode === 'async' && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#c084fc', marginBottom: '10px' }}>
                    2. Asynchronous Status Polling Configuration
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                        Response Task ID Path:
                      </label>
                      <input
                        type="text"
                        placeholder="data.taskId or request_id"
                        value={providerForm.responseTaskIdPath || ''}
                        onChange={e => setProviderForm({ ...providerForm, responseTaskIdPath: e.target.value })}
                        className="admin-input"
                        style={{ width: '100%', fontSize: '11.5px', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                        Poll URL Template (Use <code style={{ color: '#ff4f00' }}>{'{{taskId}}'}</code>):
                      </label>
                      <input
                        type="text"
                        placeholder="https://api.provider.com/v1/jobs/{{taskId}}"
                        value={providerForm.pollUrlTemplate || ''}
                        onChange={e => setProviderForm({ ...providerForm, pollUrlTemplate: e.target.value })}
                        className="admin-input"
                        style={{ width: '100%', fontSize: '11.5px', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                        Status Path:
                      </label>
                      <input
                        type="text"
                        placeholder="data.state or status"
                        value={providerForm.pollStatusPath || ''}
                        onChange={e => setProviderForm({ ...providerForm, pollStatusPath: e.target.value })}
                        className="admin-input"
                        style={{ width: '100%', fontSize: '11.5px', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                        Success Value:
                      </label>
                      <input
                        type="text"
                        placeholder="SUCCESS or succeeded"
                        value={providerForm.pollSuccessValue || ''}
                        onChange={e => setProviderForm({ ...providerForm, pollSuccessValue: e.target.value })}
                        className="admin-input"
                        style={{ width: '100%', fontSize: '11.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                        Result URL Path:
                      </label>
                      <input
                        type="text"
                        placeholder="data.resultUrl or output[0]"
                        value={providerForm.pollResultUrlPath || ''}
                        onChange={e => setProviderForm({ ...providerForm, pollResultUrlPath: e.target.value })}
                        className="admin-input"
                        style={{ width: '100%', fontSize: '11.5px', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Real Balance Checking Endpoint Settings */}
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '10px' }}>
                  3. Real Credit Balance Checking Endpoint
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                    Balance Endpoint URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.provider.com/v1/user/credit"
                    value={providerForm.balanceUrl || ''}
                    onChange={e => setProviderForm({ ...providerForm, balanceUrl: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Method:</label>
                    <select
                      value={providerForm.balanceMethod || 'GET'}
                      onChange={e => setProviderForm({ ...providerForm, balanceMethod: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '11.5px' }}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Balance JSON Path:
                    </label>
                    <input
                      type="text"
                      placeholder="data or credit"
                      value={providerForm.balanceValuePath || ''}
                      onChange={e => setProviderForm({ ...providerForm, balanceValuePath: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '11.5px', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Unit / Currency:
                    </label>
                    <input
                      type="text"
                      placeholder="Credits or USD"
                      value={providerForm.balanceUnit || 'Credits'}
                      onChange={e => setProviderForm({ ...providerForm, balanceUnit: e.target.value })}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '11.5px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="admin-btn admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  {providerModalMode === 'edit' ? 'Update Provider Configuration' : 'Save New Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD API KEYS IN BULK ──────────────────────────────── */}
      {showAddKeyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border-glass)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--admin-text-main)' }}>
              ➕ Add API Keys to {providersList.find(p => p.id === selectedBalanceProvider)?.name || selectedBalanceProvider}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 14px 0' }}>
              Paste one or multiple API keys (one per line or comma-separated). They will be added to the key rotation pool.
            </p>

            <textarea
              rows={6}
              placeholder="Paste keys here (one key per line)..."
              value={addKeyInput}
              onChange={e => setAddKeyInput(e.target.value)}
              className="admin-input"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '12.5px', marginBottom: '14px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setAddKeyInput('');
                  setShowAddKeyModal(false);
                }}
                className="admin-btn admin-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddKeysToSelectedProvider(selectedBalanceProvider)}
                className="admin-btn admin-btn-primary"
                style={{ fontWeight: 800 }}
              >
                Add Keys to Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD VISION MODEL ──────────────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '540px', background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border-glass)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--admin-text-main)' }}>
              ➕ Register New Vision Model
            </h3>

            <form onSubmit={handleAddModel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Model ID:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. flux-pro-ultra"
                    value={newModel.id}
                    onChange={e => setNewModel({ ...newModel, id: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Display Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FLUX.1 Pro Ultra"
                    value={newModel.name}
                    onChange={e => setNewModel({ ...newModel, name: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Target Provider:
                  </label>
                  <select
                    value={newModel.provider}
                    onChange={e => setNewModel({ ...newModel, provider: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    {providersList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Provider Model Slug:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. gpt-image/2.5-flare"
                    value={newModel.providerModelId}
                    onChange={e => setNewModel({ ...newModel, providerModelId: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Fallback Model Slug (optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. flux-schnell"
                    value={newModel.fallbackModelId}
                    onChange={e => setNewModel({ ...newModel, fallbackModelId: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Credits (1K / 2K / 4K):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {['1K', '2K', '4K'].map(tier => (
                      <input
                        key={tier}
                        type="number"
                        min="0"
                        placeholder={tier}
                        value={newModel.creditsByResolution?.[tier] ?? 10}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setNewModel(prev => ({
                            ...prev,
                            credits: tier === '2K' ? val : prev.credits,
                            creditsByResolution: { ...(prev.creditsByResolution || {}), [tier]: val }
                          }));
                        }}
                        className="admin-input"
                        style={{ fontSize: '11px', padding: '5px 4px', textAlign: 'center' }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Description:
                </label>
                <textarea
                  rows={2}
                  placeholder="Model capabilities..."
                  value={newModel.description}
                  onChange={e => setNewModel({ ...newModel, description: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              {/* ── Per-Model Endpoint Override in Add Model Modal ── */}
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>
                    ⚡ Model-Specific Endpoint Override (Optional)
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)' }}>
                      {newModel.endpointOverride?.enabled ? 'Override ON' : 'Use Provider Default'}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(newModel.endpointOverride?.enabled)}
                      onChange={e => setNewModel({
                        ...newModel,
                        endpointOverride: { ...(newModel.endpointOverride || {}), enabled: e.target.checked }
                      })}
                      style={{ accentColor: '#6366f1', width: '14px', height: '14px' }}
                    />
                  </label>
                </div>
                {newModel.endpointOverride?.enabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* 1-Click Endpoint Templates in Add Model Modal */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      {[
                        { label: '🌐 OpenAI Sync', fmt: 'openai', method: 'POST', url: 'https://api.openai.com/v1/images/generations' },
                        { label: '🚀 Fal Queue', fmt: 'fal', method: 'POST', url: `https://queue.fal.run/${newModel.providerModelId || newModel.id || 'model'}` },
                        { label: '🔄 Replicate', fmt: 'replicate', method: 'POST', url: `https://api.replicate.com/v1/models/${newModel.providerModelId || newModel.id || 'model'}/predictions` },
                        { label: '⚡ Kie.ai', fmt: 'kie', method: 'POST', url: 'https://api.kie.ai/api/v1/jobs/createTask' },
                        { label: '⚙️ Custom', fmt: 'custom', method: 'POST', url: '' }
                      ].map(tpl => (
                        <button
                          key={tpl.label}
                          type="button"
                          className="admin-btn admin-btn-sm"
                          style={{ fontSize: '9.5px', padding: '2px 6px' }}
                          onClick={() => setNewModel(prev => ({
                            ...prev,
                            endpointOverride: {
                              ...(prev.endpointOverride || {}),
                              enabled: true,
                              generateMethod: tpl.method,
                              payloadFormat: tpl.fmt,
                              generateUrl: tpl.url || prev.endpointOverride?.generateUrl || ''
                            }
                          }))}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px' }}>
                      <div>
                        <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Method:</label>
                        <select
                          value={newModel.endpointOverride?.generateMethod || 'POST'}
                          onChange={e => setNewModel({
                            ...newModel,
                            endpointOverride: { ...(newModel.endpointOverride || {}), generateMethod: e.target.value }
                          })}
                          className="admin-input"
                          style={{ width: '100%', fontSize: '11px' }}
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Custom Generation URL:</label>
                        <input
                          type="text"
                          placeholder="https://queue.fal.run/fal-ai/flux/schnell"
                          value={newModel.endpointOverride?.generateUrl || ''}
                          onChange={e => setNewModel({
                            ...newModel,
                            endpointOverride: { ...(newModel.endpointOverride || {}), generateUrl: e.target.value }
                          })}
                          className="admin-input"
                          style={{ width: '100%', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>Payload Format:</label>
                      <select
                        value={newModel.endpointOverride?.payloadFormat || 'openai'}
                        onChange={e => setNewModel({
                          ...newModel,
                          endpointOverride: { ...(newModel.endpointOverride || {}), payloadFormat: e.target.value }
                        })}
                        className="admin-input"
                        style={{ fontSize: '11px', width: '160px' }}
                      >
                        <option value="openai">OpenAI Compatible</option>
                        <option value="kie">Kie.ai Format</option>
                        <option value="fal">Fal.ai Queue</option>
                        <option value="replicate">Replicate</option>
                        <option value="custom">Custom JSON Template</option>
                      </select>
                    </div>
                    {newModel.endpointOverride?.payloadFormat === 'custom' && (
                      <div>
                        <label style={{ fontSize: '9.5px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                          Custom Payload Template:
                        </label>
                        <textarea
                          rows={3}
                          value={newModel.endpointOverride?.customPayloadTemplate || '{\n  "prompt": "{{prompt}}",\n  "model": "{{model}}"\n}'}
                          onChange={e => setNewModel({
                            ...newModel,
                            endpointOverride: { ...(newModel.endpointOverride || {}), customPayloadTemplate: e.target.value }
                          })}
                          className="admin-input"
                          style={{ width: '100%', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD VIRAL PRESET ──────────────────────────────────── */}
      {showAddPresetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border-glass)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--admin-text-main)' }}>
              ➕ Add Viral 1-Click Preset
            </h3>

            <form onSubmit={handleAddPreset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Emoji:
                  </label>
                  <input
                    type="text"
                    value={newPreset.emoji}
                    onChange={e => setNewPreset({ ...newPreset, emoji: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', textAlign: 'center', fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Preset ID:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mrbeast-vault"
                    value={newPreset.id}
                    onChange={e => setNewPreset({ ...newPreset, id: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Aspect Ratio:
                  </label>
                  <select
                    value={newPreset.aspectRatio}
                    onChange={e => setNewPreset({ ...newPreset, aspectRatio: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Shorts)</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Label Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="$10M Vault Challenge"
                  value={newPreset.label}
                  onChange={e => setNewPreset({ ...newPreset, label: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Prompt:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed thumbnail prompt..."
                  value={newPreset.prompt}
                  onChange={e => setNewPreset({ ...newPreset, prompt: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddPresetModal(false)}
                  className="admin-btn admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
