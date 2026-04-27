import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ChevronRight, Check } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux';
import { setPreferences, updateCoursePreferences } from '../../features/preferences/preferencesSlice';
import { DEPARTMENTS_LIST } from '../../features/preferences/constants';
import type { RootState } from '../../app/store';

interface QuickPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (department: string, semester: string, major?: string, minor?: string, toolbox?: string[]) => void;
}

const MAJORS = [
    { id: "ΒΥΝ", label: "Big Data & Intelligence" },
    { id: "ΚΔΕ", label: "Networks & Security" },
    { id: "ΨΜΑΔ", label: "Digital Business" }
];

const TOOLBOXES = ["TB1", "TB2", "TB3", "TB4", "TB5"];

export function QuickPickerModal({ isOpen, onClose, onComplete }: QuickPickerModalProps) {
  const dispatch = useDispatch();
  const currentPrefs = useSelector((state: RootState) => state.preferences);
  
  const [step, setStep] = useState<'department' | 'semester' | 'major-minor' | 'toolbox'>('department');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedSem, setSelectedSem] = useState<string | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedMinor, setSelectedMinor] = useState<string | null>(null);
  const [selectedToolbox, setSelectedToolbox] = useState<string[]>([]);

  const departments = DEPARTMENTS_LIST;
  
  const semesters = (() => {
      // Force Summer/Spring semester (Even) as requested
      return ["Β", "Δ", "ΣΤ", "Η"];
  })();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setStep('department');
        setSelectedDept(currentPrefs.department);
        setSelectedSem(currentPrefs.semester ? String(currentPrefs.semester) : null);
        setSelectedMajor(currentPrefs.major);
        setSelectedMinor(currentPrefs.minor);
        setSelectedToolbox(currentPrefs.toolbox);
    }
  }, [isOpen, currentPrefs]);

  const handleDeptSelect = (dept: string) => {
    setSelectedDept(dept);
    setTimeout(() => setStep('semester'), 200);
  };

  const handleSemesterSelect = (sem: string) => {
    setSelectedSem(sem);
    
    // Check if advanced preferences are needed (Semesters ΣΤ or Η)
    if (sem === "ΣΤ" || sem === "Η") {
        setTimeout(() => setStep('major-minor'), 200);
    } else {
        finishSelection(selectedDept!, sem);
    }
  };

  const handleMajorMinorSubmit = () => {
      if (selectedMajor && selectedMinor) {
          setStep('toolbox');
      }
  };

  const handleToolboxSubmit = () => {
      finishSelection(selectedDept!, selectedSem!, selectedMajor || undefined, selectedMinor || undefined, selectedToolbox);
  };

  const finishSelection = (dept: string, sem: string, major?: string, minor?: string, toolbox?: string[]) => {
      dispatch(setPreferences({ department: dept, semester: sem }));
      if (major || minor || toolbox) {
          dispatch(updateCoursePreferences({ major, minor, toolbox }));
      }
      
      if (onComplete) {
          onComplete(dept, sem, major, minor, toolbox);
      }

      onClose();
  };

  const toggleToolbox = (tb: string) => {
      if (selectedToolbox.includes(tb)) {
          setSelectedToolbox(prev => prev.filter(t => t !== tb));
      } else {
          setSelectedToolbox(prev => [...prev, tb]);
      }
  };

  const getStepTitle = () => {
      switch(step) {
          case 'department': return 'Select Department';
          case 'semester': return 'Select Semester';
          case 'major-minor': return 'Select Stream & Minor';
          case 'toolbox': return 'Select Toolbox Courses';
      }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white">
                        {getStepTitle()}
                    </Dialog.Title>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-2 min-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {step === 'department' && (
                        <div className="space-y-2">
                            {departments.map((dept) => (
                                <button
                                    key={dept}
                                    onClick={() => handleDeptSelect(dept)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                                        selectedDept === dept 
                                        ? "bg-ionian-blue text-white border-ionian-blue" 
                                        : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
                                    }`}
                                >
                                    <span className="font-medium">{dept}</span>
                                    <ChevronRight className={`group-hover:text-white ${selectedDept === dept ? "text-white" : "text-gray-500"}`} size={20} />
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'semester' && (
                        <div className="grid grid-cols-2 gap-3">
                            {semesters.map((sem) => (
                                <button
                                    key={sem}
                                    onClick={() => handleSemesterSelect(sem)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                                        selectedSem === sem 
                                        ? "bg-ionian-blue text-white border-ionian-blue" 
                                        : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
                                    }`}
                                >
                                    <span className="text-2xl font-bold mb-1">{sem}</span>
                                    <span className="text-xs uppercase tracking-wider opacity-60">Semester</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'major-minor' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Major (Stream)</label>
                                <div className="space-y-2">
                                    {MAJORS.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMajor(m.id)}
                                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                                                selectedMajor === m.id
                                                ? "bg-blue-500/20 border-blue-500 text-blue-200"
                                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="font-bold">{m.id}</div>
                                            <div className="text-sm opacity-70">{m.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Minor</label>
                                <div className="space-y-2">
                                    {MAJORS.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMinor(m.id)}
                                            disabled={selectedMajor === m.id}
                                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                                                selectedMinor === m.id
                                                ? "bg-purple-500/20 border-purple-500 text-purple-200"
                                                : selectedMajor === m.id 
                                                    ? "opacity-30 cursor-not-allowed border-transparent" 
                                                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="font-bold">{m.id}</div>
                                            <div className="text-sm opacity-70">{m.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={handleMajorMinorSubmit}
                                disabled={!selectedMajor || !selectedMinor}
                                className="w-full bg-ionian-blue disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 'toolbox' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Toolbox Courses</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {TOOLBOXES.map((tb) => (
                                        <button
                                            key={tb}
                                            onClick={() => toggleToolbox(tb)}
                                            className={`flex items-center justify-center p-3 rounded-lg border transition-all ${
                                                selectedToolbox.includes(tb)
                                                ? "bg-orange-500/20 border-orange-500 text-orange-200"
                                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                            }`}
                                        >
                                            {selectedToolbox.includes(tb) && <Check size={14} className="mr-1" />}
                                            <span className="font-bold">{tb}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={handleToolboxSubmit}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                            >
                                Confirm Setup
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                    {step !== 'department' && (
                        <button 
                            onClick={() => {
                                if (step === 'semester') setStep('department');
                                if (step === 'major-minor') setStep('semester');
                                if (step === 'toolbox') setStep('major-minor');
                            }}
                            className="text-sm text-gray-400 hover:text-white"
                        >
                            ← Back
                        </button>
                    )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
