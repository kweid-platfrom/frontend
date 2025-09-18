import { useState, useRef, useEffect } from 'react';
import { Building2, PlusIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import CreateSuiteModal from '../../modals/createSuiteModal';
import { safeArray, safeLength, safeMap } from '../../../utils/safeArrayUtils';

const SuiteSelector = ({ 
    testSuites, 
    activeSuite, 
    hasCreatedSuite,
    actions, 
    router,
    disabled = false 
}) => {
    const [showSuiteSelector, setShowSuiteSelector] = useState(false);
    const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
    const [suiteSelectorPosition, setSuiteSelectorPosition] = useState({ 
        top: 0, 
        left: 0, 
        right: 'auto' 
    });

    const suiteSelectorRef = useRef(null);
    const suiteSelectorButtonRef = useRef(null);

    const safeSuites = safeArray(testSuites);

    const toggleSuiteSelector = () => {
        if (disabled) return;
        setShowSuiteSelector(!showSuiteSelector);
    };

    // Close menu when clicking outside
    useEffect(() => {
        if (disabled) return;
        
        const handleClickOutside = (event) => {
            if (
                suiteSelectorRef.current &&
                !suiteSelectorRef.current.contains(event.target) &&
                suiteSelectorButtonRef.current &&
                !suiteSelectorButtonRef.current.contains(event.target)
            ) {
                setShowSuiteSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [disabled]);

    // Calculate dropdown position
    useEffect(() => {
        if (disabled) return;
        
        if (showSuiteSelector && suiteSelectorButtonRef.current) {
            const rect = suiteSelectorButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 300;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setSuiteSelectorPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
            });
        }
    }, [showSuiteSelector, disabled]);

    const handleSelectSuite = (suite) => {
        if (disabled) return;
        
        actions.suites.activateSuite(suite);
        setShowSuiteSelector(false);
        actions.ui.showNotification('info', `Switched to suite: ${suite.name}`, 2000);
    };

    const handleCreateSuite = () => {
        if (disabled) return;
        
        setShowSuiteSelector(false);
        setShowCreateSuiteModal(true);
    };

    const handleSuiteCreated = (suite) => {
        if (disabled) return;
        
        actions.suites.activateSuite(suite);
        setShowCreateSuiteModal(false);
        actions.ui.showNotification('success', `Suite "${suite.name}" created successfully!`, 3000);
        if (!hasCreatedSuite) {
            router.push('/dashboard');
        }
    };

    return (
        <>
            <div className="relative ml-2 lg:ml-4">
                <Button
                    ref={suiteSelectorButtonRef}
                    variant="ghost"
                    onClick={toggleSuiteSelector}
                    disabled={disabled}
                    leftIcon={<Building2 className="h-4 w-4 text-primary" />}
                    rightIcon={<ChevronDownIcon className="h-4 w-4 text-muted-foreground" />}
                    className="max-w-24 sm:max-w-32 lg:max-w-48 text-foreground hover:bg-accent/50"
                >
                    <span className="truncate">
                        {activeSuite ? activeSuite.name : 'Select Suite'}
                    </span>
                </Button>
            </div>

            {/* Suite Selector Dropdown */}
            {showSuiteSelector && !disabled && (
                <div
                    ref={suiteSelectorRef}
                    className="fixed bg-card border border-border shadow-lg rounded-lg z-50"
                    style={{
                        top: `${suiteSelectorPosition.top}px`,
                        left: suiteSelectorPosition.left !== 'auto' ? `${suiteSelectorPosition.left}px` : 'auto',
                        right: suiteSelectorPosition.right !== 'auto' ? `${suiteSelectorPosition.right}px` : 'auto',
                        minWidth: '300px',
                        maxWidth: '400px',
                    }}
                >
                    <div className="p-2">
                        <Button
                            variant="ghost"
                            onClick={handleCreateSuite}
                            fullWidth
                            leftIcon={<PlusIcon className="h-4 w-4" />}
                            className="justify-start mb-2 border-b border-border rounded-none"
                        >
                            Create New Suite
                        </Button>

                        <div className="max-h-64 overflow-y-auto">
                            {safeLength(safeSuites) === 0 ? (
                                <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                                    <Building2 className="h-8 w-8 mx-auto mb-2" />
                                    <p>No test suites yet</p>
                                    <p className="text-xs">Create your first suite to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {safeMap(safeSuites, (suite) => (
                                        <Button
                                            key={suite.id}
                                            variant={activeSuite?.id === suite.id ? "secondary" : "ghost"}
                                            onClick={() => handleSelectSuite(suite)}
                                            fullWidth
                                            className="justify-start text-left"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                                    activeSuite?.id === suite.id ? 'bg-primary' : 'bg-muted'
                                                }`}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate" title={suite.name}>
                                                    {suite.name}
                                                </p>
                                                {suite.description && (
                                                    <p className="text-xs text-muted-foreground truncate" title={suite.description}>
                                                        {suite.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <CreateSuiteModal
                isOpen={showCreateSuiteModal && !disabled}
                onSuiteCreated={handleSuiteCreated}
                onCancel={() => setShowCreateSuiteModal(false)}
            />
        </>
    );
};

export default SuiteSelector;