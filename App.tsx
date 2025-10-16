import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { STEPS_CONFIG } from './constants';
import { StepOutputs } from './types';
import { 
  getTopicIdeas,
  createGeneralScript, 
  createDetailedScript,
  analyzeAndExtractCharacters,
  extractAndCleanPrompts,
  identifyCharactersInPrompts,
  replacePlaceholders,
  finalizePrompts,
  extractVoiceOver,
  generateImagePromptsList,
  createThumbnailAndMetadata,
  optimizeVideoPrompts
} from './services/geminiService';
import StepProgressBar from './components/StepProgressBar';
import WandIcon from './components/icons/WandIcon';
import LoadingSpinnerIcon from './components/icons/LoadingSpinnerIcon';
import CopyIcon from './components/icons/CopyIcon';
import CheckIcon from './components/icons/CheckIcon';
import RefreshCwIcon from './components/icons/RefreshCwIcon';
import CharacterProfileCard from './components/CharacterProfileCard';
import TrashIcon from './components/icons/TrashIcon';
import LogOutIcon from './components/icons/LogOutIcon';
import PromptManager from './components/PromptManager';
import ImageIcon from './components/icons/ImageIcon';
import VideoIcon from './components/icons/VideoIcon';


// --- HELPERS ---
// Defines which step's output is the source for the current step's input
const INPUT_SOURCE_MAP: { [key: number]: number } = {
  2: 1, 3: 2, 4: 3, 5: 3, 6: 5, 9: 8, 10: 9, 11: 3, 12: 2,
};
// Steps with complex, multi-source inputs that shouldn't be edited directly
const MULTI_SOURCE_STEPS = new Set([7, 8]);


// Login Component
interface LoginProps {
  onLoginSuccess: () => void;
}
const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'VTMedia' && password === 'cungnhauhocai') {
      sessionStorage.setItem('isLoggedIn', 'true');
      onLoginSuccess();
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-white">
            Đăng Nhập
          </h2>
          <p className="mt-2 text-sm text-center text-slate-400">
            Truy cập Trình Biên Tập Video AI All - In - One
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Tên đăng nhập</label>
              <input
                id="username" name="username" type="text" autoComplete="username" required
                className="relative block w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 placeholder-slate-400 rounded-t-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">Mật khẩu</label>
              <input
                id="password-input" name="password" type="password" autoComplete="current-password" required
                className="relative block w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 placeholder-slate-400 rounded-b-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && (<p className="mt-2 text-sm text-center text-red-400">{error}</p>)}
          <div>
            <button type="submit" className="group relative flex justify-center w-full px-4 py-3 mt-6 text-sm font-medium text-white bg-sky-600 border border-transparent rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 transition-colors">
              Đăng Nhập
            </button>
          </div>
        </form>
        <div className="text-center text-sm text-slate-400 mt-6 pt-6 border-t border-slate-700">
          <p>
            Tham gia nhóm zalo <a href="https://zalo.me/g/ggyayc318" target="_blank" rel="noopener noreferrer" className="font-medium text-sky-400 hover:text-sky-300">https://zalo.me/g/ggyayc318</a> hoặc liên hệ zalo <span className="font-medium text-sky-400">0976863675</span> để lấy tài khoản sử dụng free
          </p>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [viewingStep, setViewingStep] = useState(1);
  const [stepOutputs, setStepOutputs] = useState<StepOutputs>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicKeyword, setTopicKeyword] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [saveApiKey, setSaveApiKey] = useState<boolean>(false);
  const [editableInput, setEditableInput] = useState('');
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState('');
  
  const initialSystemPrompts = useMemo(() => 
    STEPS_CONFIG.reduce((acc, step) => {
      acc[step.id] = step.systemPrompt;
      return acc;
    }, {} as { [key: number]: string }), []);
  
  const [systemPrompts, setSystemPrompts] = useState<{ [key: number]: string }>(initialSystemPrompts);
  const [savePrompts, setSavePrompts] = useState<{ [key: number]: boolean }>({});
  
  const [topicIdeas, setTopicIdeas] = useState<string[]>([]);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedAllResults, setCopiedAllResults] = useState<boolean>(false);


  useEffect(() => {
    const loggedInStatus = sessionStorage.getItem('isLoggedIn');
    if (loggedInStatus === 'true') setIsLoggedIn(true);
    
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setSaveApiKey(true);
    }
    try {
        const savedPrompts = localStorage.getItem('savedSystemPrompts');
        if (savedPrompts) setSystemPrompts(prev => ({...prev, ...JSON.parse(savedPrompts)}));
        const savedPromptCheckboxes = localStorage.getItem('savedPromptCheckboxes');
        if (savedPromptCheckboxes) setSavePrompts(JSON.parse(savedPromptCheckboxes));
        const savedOutputs = localStorage.getItem('scriptGenerator_stepOutputs');
        if (savedOutputs) setStepOutputs(JSON.parse(savedOutputs));

        const savedCompleted = localStorage.getItem('scriptGenerator_completedSteps');
        if (savedCompleted) {
            const completed: number[] = JSON.parse(savedCompleted);
            if(Array.isArray(completed)) {
              setCompletedSteps(completed);
              if (completed.length > 0) {
                  const maxCompleted = Math.max(...completed);
                  const nextStep = maxCompleted < STEPS_CONFIG.length ? maxCompleted + 1 : STEPS_CONFIG.length;
                  setCurrentStep(nextStep);
                  setViewingStep(nextStep);
              }
            }
        }
        const savedKeyword = localStorage.getItem('scriptGenerator_topicKeyword');
        if (savedKeyword) setTopicKeyword(savedKeyword);
    } catch (e) {
        console.error("Failed to load data from localStorage", e);
        // Optionally clear corrupted data
        localStorage.removeItem('savedSystemPrompts');
        localStorage.removeItem('savedPromptCheckboxes');
        localStorage.removeItem('scriptGenerator_stepOutputs');
        localStorage.removeItem('scriptGenerator_completedSteps');
    }
  }, []);
  
  useEffect(() => {
    if (saveApiKey) localStorage.setItem('geminiApiKey', apiKey);
  }, [apiKey, saveApiKey]);

  useEffect(() => {
    localStorage.setItem('scriptGenerator_stepOutputs', JSON.stringify(stepOutputs));
  }, [stepOutputs]);
  
  useEffect(() => {
    localStorage.setItem('scriptGenerator_completedSteps', JSON.stringify(completedSteps));
  }, [completedSteps]);
  
  useEffect(() => {
    localStorage.setItem('scriptGenerator_topicKeyword', topicKeyword);
  }, [topicKeyword]);

  const handleLoginSuccess = () => setIsLoggedIn(true);

  const clearProjectData = useCallback(() => {
    // Reset state variables
    setCurrentStep(1);
    setViewingStep(1);
    setStepOutputs({});
    setCompletedSteps([]);
    setIsLoading(false);
    setError(null);
    setTopicKeyword('');
    setTopicIdeas([]);
    setSelectedTopicIndex(null);
    setEditableInput('');
    setSystemPrompts(initialSystemPrompts);
    setSavePrompts({});

    // Clear all relevant localStorage
    localStorage.removeItem('scriptGenerator_stepOutputs');
    localStorage.removeItem('scriptGenerator_completedSteps');
    localStorage.removeItem('scriptGenerator_topicKeyword');
    localStorage.removeItem('savedSystemPrompts');
    localStorage.removeItem('savedPromptCheckboxes');
  }, [initialSystemPrompts]);

  const handleLogout = () => {
    clearProjectData();
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const handleResetProject = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu dự án và bắt đầu lại không? Hành động này không thể hoàn tác.")) {
      clearProjectData();
    }
  };
  
  const activeStepConfig = useMemo(() => {
    return STEPS_CONFIG.find(step => step.id === viewingStep)!;
  }, [viewingStep]);

  const getInputForStep = useCallback((stepId: number): string | null => {
    switch (stepId) {
        case 1: return topicKeyword;
        case 2: return stepOutputs[1];
        case 3: return stepOutputs[2];
        case 4: return stepOutputs[3];
        case 5: return stepOutputs[3];
        case 6: return stepOutputs[5];
        case 7:
            if (!stepOutputs[4] || !stepOutputs[6]) return null;
            return `--- PHÂN TÍCH VÀ HỒ SƠ NHÂN VẬT (TỪ BƯỚC 4) ---\n${stepOutputs[4]}\n\n--- DANH SÁCH IMAGE PROMPT (TỪ BƯỚC 6) ---\n${stepOutputs[6]}`;
        case 8:
            if (!stepOutputs[4] || !stepOutputs[7]) return null;
            return `--- PHÂN TÍCH VÀ HỒ SƠ NHÂN VẬT (TỪ BƯỚC 4) ---\n${stepOutputs[4]}\n\n--- IMAGE PROMPT ĐÃ GẮN THẺ (TỪ BƯỚC 7) ---\n${stepOutputs[7]}`;
        case 9: return stepOutputs[8];
        case 10: return stepOutputs[9];
        case 11: return stepOutputs[3];
        case 12: return stepOutputs[2];
        default: return '';
    }
  }, [stepOutputs, topicKeyword]);

  useEffect(() => {
    const inputContent = getInputForStep(viewingStep) ?? '';
    setEditableInput(inputContent);
    setUpdateSuccessMessage('');
  }, [viewingStep, stepOutputs, getInputForStep]);


  const handleUpdateInput = () => {
    const sourceStepId = INPUT_SOURCE_MAP[viewingStep];
    if (sourceStepId) {
      setStepOutputs(prev => ({...prev, [sourceStepId]: editableInput }));
      setUpdateSuccessMessage('Dữ liệu đầu vào đã được cập nhật thành công!');
      setTimeout(() => setUpdateSuccessMessage(''), 3000);
    }
  };
  
  const handleUpdateStepOutput = useCallback((stepId: number, newOutput: string) => {
    setStepOutputs(prev => ({ ...prev, [stepId]: newOutput }));
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value);

  const handleSaveKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveApiKey(e.target.checked);
    if (e.target.checked) localStorage.setItem('geminiApiKey', apiKey);
    else localStorage.removeItem('geminiApiKey');
  };
  
  const handleStepClick = (stepId: number) => setViewingStep(stepId);

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setSystemPrompts(prev => {
        const updated = {...prev, [viewingStep]: newPrompt};
        if (savePrompts[viewingStep]) {
            const saved = JSON.parse(localStorage.getItem('savedSystemPrompts') || '{}');
            saved[viewingStep] = newPrompt;
            localStorage.setItem('savedSystemPrompts', JSON.stringify(saved));
        }
        return updated;
    });
  }

  const handleRestorePrompt = () => {
    const defaultPrompt = initialSystemPrompts[viewingStep];
    setSystemPrompts(prev => ({...prev, [viewingStep]: defaultPrompt}));
    if (savePrompts[viewingStep]) {
        const saved = JSON.parse(localStorage.getItem('savedSystemPrompts') || '{}');
        delete saved[viewingStep];
        localStorage.setItem('savedSystemPrompts', JSON.stringify(saved));
    }
  }

  const handleSavePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSavePrompts(prev => {
        const updated = {...prev, [viewingStep]: isChecked};
        localStorage.setItem('savedPromptCheckboxes', JSON.stringify(updated));
        
        const savedPrompts = JSON.parse(localStorage.getItem('savedSystemPrompts') || '{}');
        if(isChecked) savedPrompts[viewingStep] = systemPrompts[viewingStep];
        else delete savedPrompts[viewingStep];
        localStorage.setItem('savedSystemPrompts', JSON.stringify(savedPrompts));

        return updated;
    });
  }

  const handleCompleteStep1 = () => {
      if (selectedTopicIndex === null) {
          setError("Vui lòng chọn một ý tưởng để tiếp tục.");
          return;
      }
      const selectedTopic = topicIdeas[selectedTopicIndex];
      setStepOutputs(prev => ({ ...prev, 1: selectedTopic }));
      if (!completedSteps.includes(1)) setCompletedSteps(prev => [...prev, 1].sort((a, b) => a - b));
      const nextStep = 2;
      setCurrentStep(nextStep);
      setViewingStep(nextStep);
  }
  
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompts[viewingStep]);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const getCopyableResultText = useCallback((stepId: number) => {
    const output = stepOutputs[stepId];
    if (!output) return '';
    if (stepId === 11) {
       return output.split('\n').map(line => line.trim()).filter(line => line.match(/^\d+\.\s/)).map(line => line.replace(/^\d+\.\s*/, '')).join('\n');
    }
    if (stepId === 5) {
        try {
            let jsonString = output.match(/\{[\s\S]*\}/)?.[0] || '{}';
            const parsed = JSON.parse(jsonString);
            const images = (parsed.imagePrompts || []).join('\n');
            const videos = (parsed.videoPrompts || []).join('\n');
            return `--- IMAGE PROMPTS ---\n${images}\n\n--- VIDEO PROMPTS ---\n${videos}`;
        } catch { return output; }
    }
    return output;
  }, [stepOutputs]);

  const handleCopyResult = () => {
    const textToCopy = getCopyableResultText(viewingStep);
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    }
  };

  const handleCopyAllResults = () => {
    let fullReport = "BÁO CÁO TỔNG HỢP KỊCH BẢN VIDEO\n=================================\n\n";
    STEPS_CONFIG.forEach(step => {
        if (stepOutputs[step.id]) {
            fullReport += `--- ${step.title.toUpperCase()} ---\n\n`;
            fullReport += `${getCopyableResultText(step.id).trim()}\n\n`;
        }
    });
    navigator.clipboard.writeText(fullReport);
    setCopiedAllResults(true);
    setTimeout(() => setCopiedAllResults(false), 3000);
  };

  const parseAndSetIdeas = (result: string) => {
    if (!result) return;
    const normalizedResult = result.normalize('NFC').trim();
    const ideaMarkerRegex = /[YÝ]\s*TƯỞNG\s*\d+\s*:/i;
    const splitRegex = /(?=[YÝ]\s*TƯỞNG\s*\d+\s*:)/gi;
    let ideas: string[] = [];
  
    if (ideaMarkerRegex.test(normalizedResult)) {
      ideas = normalizedResult.split(splitRegex).map(idea => idea.trim()).filter(idea => ideaMarkerRegex.test(idea));
    } else {
      const fallbackIdeas = normalizedResult.split('\n').map(line => line.trim()).filter(line => line.length > 0 && /^\s*(?:[\d#*-]+\.?\s*)/.test(line));
      if (fallbackIdeas.length > 1) ideas.push(...fallbackIdeas);
    }
    if (ideas.length === 0 && normalizedResult.length > 0) ideas.push(normalizedResult);
    setTopicIdeas(ideas);
    setSelectedTopicIndex(null);
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Vui lòng nhập API Key của bạn.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const systemPrompt = systemPrompts[currentStep];
    let result: string | undefined;

    try {
      if (currentStep === 1) {
        if (!topicKeyword) throw new Error("Vui lòng nhập chủ đề hoặc từ khóa.");
        result = await getTopicIdeas(apiKey, topicKeyword, systemPrompt);
        if (result && !result.toLowerCase().includes('lỗi')) parseAndSetIdeas(result);
        else throw new Error(result || "Không thể tạo ý tưởng.");
      } else {
          // Use the potentially edited input for generation
          const input = getInputForStep(currentStep);
          if (input === null) throw new Error("Không tìm thấy dữ liệu đầu vào. Vui lòng hoàn thành bước trước.");
          
          switch (currentStep) {
            case 2: result = await createGeneralScript(apiKey, input, systemPrompt); break;
            case 3: result = await createDetailedScript(apiKey, input, systemPrompt); break;
            case 4: result = await analyzeAndExtractCharacters(apiKey, input, systemPrompt); break;
            case 5: result = await extractAndCleanPrompts(apiKey, input, systemPrompt); break;
            case 6: result = await generateImagePromptsList(apiKey, input, systemPrompt); break;
            case 7: result = await identifyCharactersInPrompts(apiKey, input, systemPrompt); break;
            case 8: result = await replacePlaceholders(apiKey, input, systemPrompt); break;
            case 9: result = await finalizePrompts(apiKey, input, systemPrompt); break;
            case 10: result = await optimizeVideoPrompts(apiKey, input, systemPrompt); break;
            case 11: result = await extractVoiceOver(apiKey, input, systemPrompt); break;
            case 12: result = await createThumbnailAndMetadata(apiKey, input, systemPrompt); break;
            default: throw new Error("Bước không hợp lệ.");
          }

          if (result) {
            setStepOutputs(prev => ({ ...prev, [currentStep]: result as string }));
            if (!completedSteps.includes(currentStep)) setCompletedSteps(prev => [...prev, currentStep].sort((a, b) => a - b));
            if (currentStep < STEPS_CONFIG.length) {
              const nextStep = currentStep + 1;
              setCurrentStep(nextStep);
              setViewingStep(nextStep);
            }
          } else throw new Error("API không trả về kết quả.");
      }
    } catch (e: any) { setError(e.message); } 
    finally { setIsLoading(false); }
  };

 const handleRegenerate = async () => {
    if (!apiKey) {
      setError("Vui lòng nhập API Key của bạn.");
      return;
    }
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    const stepToRegenerate = viewingStep;
    const systemPrompt = systemPrompts[stepToRegenerate];
    const input = getInputForStep(stepToRegenerate);
    let result: string | undefined;

    try {
      if (input === null && stepToRegenerate !== 1) throw new Error(`Không tìm thấy dữ liệu đầu vào cho bước ${stepToRegenerate}.`);
      
      switch (stepToRegenerate) {
        case 1:
            if (!topicKeyword) throw new Error("Vui lòng nhập chủ đề hoặc từ khóa để tạo lại ý tưởng.");
            result = await getTopicIdeas(apiKey, topicKeyword, systemPrompt);
            if (result && !result.toLowerCase().includes('lỗi')) parseAndSetIdeas(result);
            else throw new Error(result || "Không thể tạo ý tưởng mới.");
            break; 
        case 2: result = await createGeneralScript(apiKey, input!, systemPrompt); break;
        case 3: result = await createDetailedScript(apiKey, input!, systemPrompt); break;
        case 4: result = await analyzeAndExtractCharacters(apiKey, input!, systemPrompt); break;
        case 5: result = await extractAndCleanPrompts(apiKey, input!, systemPrompt); break;
        case 6: result = await generateImagePromptsList(apiKey, input!, systemPrompt); break;
        case 7: result = await identifyCharactersInPrompts(apiKey, input!, systemPrompt); break;
        case 8: result = await replacePlaceholders(apiKey, input!, systemPrompt); break;
        case 9: result = await finalizePrompts(apiKey, input!, systemPrompt); break;
        case 10: result = await optimizeVideoPrompts(apiKey, input!, systemPrompt); break;
        case 11: result = await extractVoiceOver(apiKey, input!, systemPrompt); break;
        case 12: result = await createThumbnailAndMetadata(apiKey, input!, systemPrompt); break;
        default: throw new Error("Bước này không thể tạo lại.");
      }

      if (result && stepToRegenerate > 1) setStepOutputs(prev => ({ ...prev, [stepToRegenerate]: result as string }));
      else if (!result && stepToRegenerate > 1) throw new Error("API không trả về kết quả.");
    } catch (e: any) { setError(e.message); } 
    finally { setIsLoading(false); }
  };

  const renderInputContent = () => {
    if (viewingStep === 1) {
      return (
        <div className="mb-4">
            <label htmlFor="topic-keyword" className="block text-sm font-medium text-slate-300 mb-2">Nhập Chủ Đề hoặc Từ Khóa</label>
            <input type="text" id="topic-keyword" value={topicKeyword} onChange={(e) => setTopicKeyword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500" placeholder="Ví dụ: 'khám phá không gian', 'AI trong y tế'..." />
        </div>
      );
    }
    
    const originalInput = getInputForStep(viewingStep);

    if (originalInput) {
        const isEditable = !MULTI_SOURCE_STEPS.has(viewingStep);
        return (
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Dữ Liệu Đầu Vào:</h3>
                {isEditable ? (
                    <>
                        <textarea
                            value={editableInput}
                            onChange={(e) => setEditableInput(e.target.value)}
                            rows={8}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        />
                        <div className="h-8 mt-2 flex items-center justify-between">
                            {editableInput !== originalInput && (
                                <button
                                    onClick={handleUpdateInput}
                                    className="px-3 py-1 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-800 transition-colors"
                                >
                                    Cập Nhật Dữ Liệu
                                </button>
                            )}
                            {updateSuccessMessage && <p className="text-green-400 text-sm">{updateSuccessMessage}</p>}
                        </div>
                    </>
                ) : (
                    <div className="bg-slate-900 p-4 rounded-md max-h-60 overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap border border-slate-700">
                        {originalInput}
                        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-600">Lưu ý: Dữ liệu đầu vào cho bước này được tổng hợp từ nhiều nguồn và không thể chỉnh sửa trực tiếp.</p>
                    </div>
                )}
            </div>
        );
    }
    return null;
  }
  
  const renderSplitPromptView = (output: string) => {
    let imagePrompts: string[] = [], videoPrompts: string[] = [], parseError = false;
    let originalJson = {};

    let jsonString = output.replace(/```json/g, '').replace(/```/g, '').trim();
    const startIndex = jsonString.indexOf('{'), endIndex = jsonString.lastIndexOf('}');

    if (startIndex !== -1 && endIndex > startIndex) {
        jsonString = jsonString.substring(startIndex, endIndex + 1);
        try {
            const parsed = JSON.parse(jsonString);
            originalJson = parsed;
            imagePrompts = Array.isArray(parsed.imagePrompts) ? parsed.imagePrompts : [];
            videoPrompts = Array.isArray(parsed.videoPrompts) ? parsed.videoPrompts : [];
        } catch (e) { console.error("JSON parsing failed:", e); parseError = true; }
    } else { parseError = true; }

    if (parseError) {
        return (
            <div>
                <p className="text-red-400 mb-2">Lỗi phân tích cú pháp JSON. Hiển thị dữ liệu thô:</p>
                <p className="text-slate-300 whitespace-pre-wrap">{output}</p>
            </div>
        );
    }

    const handleUpdate = (type: 'image' | 'video', newPrompts: string[]) => {
        const updatedData = {
            ...originalJson,
            imagePrompts: type === 'image' ? newPrompts : imagePrompts,
            videoPrompts: type === 'video' ? newPrompts : videoPrompts,
        };
        handleUpdateStepOutput(5, JSON.stringify(updatedData, null, 2));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <PromptManager
                title="Image Prompts"
                prompts={imagePrompts}
                onUpdate={(newPrompts) => handleUpdate('image', newPrompts)}
                icon={<ImageIcon className="h-5 w-5 text-sky-400" />}
            />
            <PromptManager
                title="Video Prompts"
                prompts={videoPrompts}
                onUpdate={(newPrompts) => handleUpdate('video', newPrompts)}
                icon={<VideoIcon className="h-5 w-5 text-teal-400" />}
            />
        </div>
    );
  }

  const parseCharacterProfiles = (text: string) => {
    const markerRegex = /---\s*(?:NHÂN VẬT|HỒ SƠ NHÂN VẬT)\s*---/i;
    const match = text.match(markerRegex);
    if (!match) return [];
  
    const characterText = text.substring(match.index! + match[0].length).trim();
    if (!characterText) return [];
  
    const profiles = characterText.split(/\n\s*\n?(?=\*\*|[\p{L}\s]+-)/u).map(s => s.trim()).filter(Boolean);
  
    return profiles.map(profileText => {
      const nameMatch = profileText.match(/\*\*(.*?)\*\*/);
      const descMatch = profileText.match(/- \*\*Mô tả:\*\*([\s\S]*?)(?=- \*\*Từ khóa:\*\*|$)/);
      const keywordsMatch = profileText.match(/- \*\*Từ khóa:\*\*([\s\S]*)/);
  
      if (nameMatch && descMatch) {
        return { name: nameMatch[1].trim(), description: descMatch[1].trim(), keywords: keywordsMatch ? keywordsMatch[1].trim() : 'Không có từ khóa.' };
      }
      const simpleMatch = profileText.match(/^([\p{L}\s\d_]+)\s*-\s*(.*)$/u);
      if (simpleMatch) {
        return { name: simpleMatch[1].trim(), description: simpleMatch[2].trim(), keywords: 'N/A (đã gộp trong mô tả)' };
      }
      return { name: 'Lỗi Phân Tích', description: profileText, keywords: '' };
    });
  };

  const renderResultsContent = () => {
    if (isLoading && viewingStep === currentStep && !stepOutputs[viewingStep]) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-center">
                    <LoadingSpinnerIcon className="animate-spin mx-auto h-8 w-8 text-sky-500" />
                    <p className="text-slate-500 mt-2">Đang chờ tạo kết quả...</p>
                </div>
            </div>
        );
    }
    if (viewingStep === 4 && stepOutputs[viewingStep]) {
        const analysisPart = stepOutputs[viewingStep]!.split(/---.*---/i)[0];
        const characters = parseCharacterProfiles(stepOutputs[viewingStep]!);
        return (
          <div>
            <div className="whitespace-pre-wrap mb-6 pb-4 border-b border-slate-700">{analysisPart}</div>
            <h3 className="text-xl font-bold text-slate-300 mb-4">Hồ Sơ Nhân Vật</h3>
            <div className="space-y-4">
              {characters.length > 0 ? characters.map((char, index) => (
                <CharacterProfileCard key={index} name={char.name} description={char.description} keywords={char.keywords} />
              )) : <p className="text-slate-500">Không tìm thấy hồ sơ nhân vật hợp lệ trong kết quả.</p>}
            </div>
          </div>
        );
    }
    if (viewingStep === 5 && stepOutputs[viewingStep]) return renderSplitPromptView(stepOutputs[viewingStep]!);

    if ([6, 7, 8, 9, 10].includes(viewingStep) && stepOutputs[viewingStep]) {
      const prompts = stepOutputs[viewingStep]!.split('\n').filter(Boolean);
      const titles: { [key: number]: string } = {
          6: 'Tách Image Prompts',
          7: 'Định Danh Nhân Vật (Ảnh)',
          8: 'Thay Thế Mô Tả (Ảnh)',
          9: 'Tối Ưu Hóa Image Prompts',
          10: 'Tối Ưu Hóa Video Prompts'
      };
      return (
          <PromptManager
              title={titles[viewingStep]}
              prompts={prompts}
              onUpdate={(newPrompts) => {
                  handleUpdateStepOutput(viewingStep, newPrompts.join('\n'));
              }}
              icon={viewingStep === 10 ? <VideoIcon className="h-5 w-5 text-teal-400"/> : <ImageIcon className="h-5 w-5 text-sky-400"/>}
          />
      );
    }

    if (viewingStep === 1) {
      return (
        <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {topicIdeas.map((idea, index) => (
                    <div key={index} className="bg-slate-700/50 p-3 rounded-md transition-all duration-300 border border-slate-700">
                        <div className="flex items-start">
                            <input
                                type="radio" id={`idea-${index}`} name="topic-idea"
                                className="h-4 w-4 mt-1 border-slate-500 bg-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer flex-shrink-0"
                                checked={selectedTopicIndex === index} onChange={() => setSelectedTopicIndex(index)}
                            />
                            <label htmlFor={`idea-${index}`} className="ml-3 text-slate-300 select-none cursor-pointer text-sm flex-grow whitespace-pre-wrap">{idea}</label>
                        </div>
                    </div>
                ))}
                {isLoading && currentStep === 1 && (
                    <div className="flex justify-center items-center pt-4">
                        <LoadingSpinnerIcon className="animate-spin mr-3 h-5 w-5" />
                        <p className="text-slate-500">Đang tìm ý tưởng...</p>
                    </div>
                )}
            </div>
        </>
      );
    }
    
    const output = stepOutputs[viewingStep];
    if (!output && !isLoading) return <p className="text-slate-500">Chưa có kết quả. Hãy tạo kết quả ở bảng bên trái.</p>
    return <div className="whitespace-pre-wrap">{output || ''}</div>;
  }

  const renderCopyAllButton = () => {
    if (!completedSteps.includes(12)) return null;
    return (
        <div className="mt-12 text-center">
            <button
                onClick={handleCopyAllResults}
                className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-900 transition-all transform hover:scale-105"
                disabled={copiedAllResults}
            >
                {copiedAllResults ? ( <> <CheckIcon className="h-6 w-6 mr-3" /> Đã Sao Chép Toàn Bộ Báo Cáo! </> ) : 
                                     ( <> <CopyIcon className="h-6 w-6 mr-3" /> Sao Chép Toàn Bộ Kết Quả </> )}
            </button>
        </div>
    );
  };
  
  if (!isLoggedIn) return <Login onLoginSuccess={handleLoginSuccess} />;

  const isPromptStep = [5, 6, 7, 8, 9, 10].includes(viewingStep) && stepOutputs[viewingStep];

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">Trình Biên Tập Video AI All - In - One</h1>
          <p className="mt-3 max-w-md mx-auto text-base text-slate-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">Xây dựng kịch bản video chuyên nghiệp với quy trình 12 bước thông minh.</p>
          <div className="mt-6 max-w-2xl mx-auto text-slate-400 text-sm p-4 bg-slate-800/50 rounded-lg border border-slate-700">
             <p>Contact: 0976863675</p>
            <p>Kết Bạn Zalo Hoặc Tham Gia Group <a href="https://zalo.me/g/ggyayc318" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Tại Đây</a> Để Được Hướng Dẫn Thêm</p>
            <p className="mt-2">Nếu Phần Mềm Hữu Ích Có Thể Donate 1 Ly Cafe Động Viên Mình Nhé:</p>
            <p className="font-mono">MB Bank: 1992.8668.86.86.86</p>
          </div>
        </header>

        <div className="flex justify-end items-center gap-4 mb-8 -mt-8">
            <button 
                onClick={handleResetProject}
                className="inline-flex items-center px-4 py-2 border border-red-600/50 text-sm font-medium rounded-md shadow-sm text-red-300 bg-red-900/20 hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-900 transition-colors"
                title="Reset toàn bộ dự án"
            >
                <TrashIcon className="h-4 w-4 mr-2" />
                Reset Dự Án
            </button>
            <button 
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-300 bg-slate-700/50 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 transition-colors"
                title="Đăng xuất"
            >
                <LogOutIcon className="h-4 w-4 mr-2" />
                Đăng Xuất
            </button>
        </div>

        <div className="max-w-3xl mx-auto mb-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-slate-300">Gemini API Key</label>
            <input type="password" id="api-key" value={apiKey} onChange={handleApiKeyChange} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500" placeholder="Nhập API Key của bạn vào đây" />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center">
                <input id="save-api-key" type="checkbox" checked={saveApiKey} onChange={handleSaveKeyChange} className="h-4 w-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500" />
                <label htmlFor="save-api-key" className="ml-2 block text-sm text-slate-400">Lưu API Key</label>
              </div>
              <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 hover:text-sky-300">Tạo API Key ở đây nếu chưa có</a>
            </div>
          </div>
        </div>

        <div className="mb-12">
            <StepProgressBar steps={STEPS_CONFIG} currentStep={viewingStep} completedSteps={completedSteps} onStepClick={handleStepClick} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col border border-slate-700">
                <h2 className="text-2xl font-bold mb-1 text-sky-400">{activeStepConfig.title}</h2>
                <p className="text-slate-400 mb-6">{activeStepConfig.description}</p>
                <div className="mb-4 relative">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-slate-300">System Messenger (Vai trò AI):</h3>
                    <button onClick={handleRestorePrompt} className="text-xs text-sky-400 hover:text-sky-300">Khôi phục mặc định</button>
                  </div>
                  <textarea value={systemPrompts[viewingStep]} onChange={handleSystemPromptChange} rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm p-2 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm" />
                  <div className="absolute top-[34px] right-2">
                      <button onClick={handleCopyPrompt} title="Copy Prompt" className="p-1 rounded-md bg-slate-800/50 hover:bg-slate-700 transition-colors">
                          {copiedPrompt ? <CheckIcon className="h-4 w-4 text-green-400" /> : <CopyIcon className="h-4 w-4 text-slate-400 hover:text-white" />}
                      </button>
                  </div>
                  <div className="mt-2 flex items-center">
                    <input id={`save-prompt-${viewingStep}`} type="checkbox" checked={!!savePrompts[viewingStep]} onChange={handleSavePromptChange} className="h-4 w-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500" />
                    <label htmlFor={`save-prompt-${viewingStep}`} className="ml-2 block text-sm text-slate-400">Lưu thay đổi prompt này</label>
                  </div>
                </div>
                <div className="flex-grow">{renderInputContent()}</div>
                <div className="mt-auto space-y-4">
                    {viewingStep === 1 && topicIdeas.length > 0 && (
                        <button onClick={handleCompleteStep1} disabled={selectedTopicIndex === null} className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-800 disabled:bg-slate-500 disabled:cursor-not-allowed">
                            Hoàn Tất Bước 1 & Viết Kịch Bản
                        </button>
                    )}
                    {viewingStep === currentStep && (
                      <button onClick={handleGenerate} disabled={isLoading || (currentStep > 1 && !completedSteps.includes(currentStep - 1))} className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
                          {isLoading ? (<> <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" /> Đang xử lý... </>) : 
                                      (<> <WandIcon className="-ml-1 mr-2 h-5 w-5" /> {STEPS_CONFIG.find(s => s.id === currentStep)?.buttonText} </>)}
                      </button>
                    )}
                    {completedSteps.includes(viewingStep) && (
                      <button onClick={handleRegenerate} disabled={isLoading} className="w-full inline-flex justify-center items-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
                          {isLoading ? (<> <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" /> Đang tạo lại... </>) : 
                                      (<> <RefreshCwIcon className="-ml-1 mr-2 h-5 w-5" /> {viewingStep === 1 ? 'Tạo Lại Ý Tưởng' : 'Tạo Lại Kết Quả'} </>)}
                      </button>
                    )}
                </div>
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </div>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-300">Kết Quả</h2>
                   {!!stepOutputs[viewingStep] && !isPromptStep && (
                      <button onClick={handleCopyResult} title="Copy Kết Quả" className="p-1 rounded-md hover:bg-slate-700 transition-colors">
                          {copiedResult ? <CheckIcon className="h-5 w-5 text-green-400" /> : <CopyIcon className="h-5 w-5 text-slate-400 hover:text-white" />}
                      </button>
                   )}
                </div>
                <div className={`bg-slate-900 rounded-md flex-grow overflow-y-auto border border-slate-700 ${!isPromptStep ? 'p-4' : 'p-0'}`}>
                    {renderResultsContent()}
                </div>
            </div>
        </div>
        {renderCopyAllButton()}
      </main>
    </div>
  );
}

export default App;