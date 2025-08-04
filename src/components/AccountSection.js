import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppProvider';
import {
    Building2,
    User,
    Plus,
    ChevronDown,
    Check,
    Settings,
    Users,
    ArrowRightLeft,
    Loader2,
    X
} from 'lucide-react';
import AddAccountModal from '../components/modals/AddAccountModal';

const AccountSection = ({ isCollapsed }) => {
    const { state, actions } = useApp();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [switchingAccount, setSwitchingAccount] = useState(null);
    const [removingAccount, setRemovingAccount] = useState(null);
    const dropdownRef = useRef(null);
    
    const { currentUser, userProfile, accountType, loading } = state.auth;
    
    // Get available accounts from user profile
    const availableAccounts = userProfile?.availableAccounts || [];
    const isIndividual = accountType === 'individual';
    
    // Current account info
    const currentAccount = {
        id: currentUser?.uid,
        email: currentUser?.email,
        name: getCurrentAccountDisplayName(),
        accountType: accountType,
        organizationName: userProfile?.organizationName,
        organizationId: userProfile?.organizationId,
        isActive: true
    };

    // All accounts including current
    const allAccounts = [
        currentAccount,
        ...availableAccounts.filter(acc => acc.id !== currentUser?.uid)
    ];

    function getCurrentAccountDisplayName() {
        if (isIndividual) {
            return 'Freelancer';
        }
        return userProfile?.organizationName || 'Organization';
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddAccount = () => {
        setIsDropdownOpen(false);
        setShowAddAccountModal(true);
    };

    const handleAccountAdded = async (newAccountData) => {
        console.log('New account added:', newAccountData);
        
        // Show success notification
        actions.ui.showNotification?.({
            id: 'account-added',
            type: 'success',
            message: `${newAccountData.accountType === 'individual' ? 'Freelancer' : 'Organization'} account added successfully`,
            description: `Switching to ${getAccountDisplayName(newAccountData)}`,
            duration: 4000,
        });

        // Refresh user profile to get updated available accounts
        try {
            await actions.auth.refreshUserProfile();
            
            // Immediately switch to the new account
            await handleSwitchAccount(newAccountData);
        } catch (error) {
            console.error('Failed to refresh accounts after adding new account:', error);
            actions.ui.showNotification?.({
                id: 'refresh-accounts-error',
                type: 'error',
                message: 'Failed to refresh accounts',
                description: 'Please refresh the page to see the new account',
                duration: 5000,
            });
        }
    };

    const handleSwitchAccount = async (targetAccount) => {
        if (switchingAccount === targetAccount.id) return;
        
        setSwitchingAccount(targetAccount.id);
        
        try {
            console.log('Switching to account:', {
                id: targetAccount.id,
                type: targetAccount.accountType,
                organizationId: targetAccount.organizationId
            });

            // Call the auth slice's switch account function if it exists
            let switchResult;
            if (actions.auth.switchAccount) {
                switchResult = await actions.auth.switchAccount(targetAccount);
            } else {
                // Fallback: manually update the auth state with target account info
                switchResult = await switchAccountFallback(targetAccount);
            }
            
            if (switchResult?.success) {
                actions.ui.showNotification?.({
                    id: 'account-switched',
                    type: 'success',
                    message: 'Account switched successfully',
                    description: `Switched to ${getAccountDisplayName(targetAccount)}`,
                    duration: 3000,
                });
                setIsDropdownOpen(false);
                
                // Clear any cached data that might be account-specific
                actions.clearState?.();
            } else {
                throw new Error(switchResult?.error || 'Failed to switch account');
            }
        } catch (error) {
            console.error('Error switching account:', error);
            actions.ui.showNotification?.({
                id: 'switch-account-error',
                type: 'error',
                message: 'Failed to switch account',
                description: error.message || 'Please try again or refresh the page',
                duration: 5000,
            });
        } finally {
            setSwitchingAccount(null);
        }
    };

    const handleRemoveAccount = async (accountToRemove, event) => {
        event.stopPropagation();

        // Don't allow removing the current account
        const isCurrentAccount = accountToRemove.id === currentUser?.uid && 
                               accountToRemove.accountType === accountType &&
                               accountToRemove.organizationId === userProfile?.organizationId;
        
        if (isCurrentAccount) {
            actions.ui.showNotification?.({
                id: 'cannot-remove-current-account',
                type: 'error',
                message: 'Cannot remove current account',
                description: 'Switch to another account first before removing this one',
                duration: 4000,
            });
            return;
        }

        setRemovingAccount(accountToRemove.id);
        
        try {
            console.log('Removing account:', {
                id: accountToRemove.id,
                type: accountToRemove.accountType,
                organizationId: accountToRemove.organizationId
            });

            // Call the auth slice's remove account function if it exists
            let removeResult;
            if (actions.auth.removeAccount) {
                removeResult = await actions.auth.removeAccount(accountToRemove);
            } else {
                // Fallback: remove from available accounts
                removeResult = await removeAccountFallback(accountToRemove);
            }
            
            if (removeResult?.success) {
                actions.ui.showNotification?.({
                    id: 'account-removed',
                    type: 'success',
                    message: 'Account removed successfully',
                    description: `${getAccountDisplayName(accountToRemove)} has been removed from your accounts`,
                    duration: 3000,
                });
                
                // Refresh user profile to get updated available accounts
                await actions.auth.refreshUserProfile();
            } else {
                throw new Error(removeResult?.error || 'Failed to remove account');
            }
        } catch (error) {
            console.error('Error removing account:', error);
            actions.ui.showNotification?.({
                id: 'remove-account-error',
                type: 'error',
                message: 'Failed to remove account',
                description: error.message || 'Please try again or refresh the page',
                duration: 5000,
            });
        } finally {
            setRemovingAccount(null);
        }
    };

    // Fallback method for account switching if not implemented in auth slice
    const switchAccountFallback = async (targetAccount) => {
        try {
            // Update the user profile in Firestore to set active account
            const updateData = {
                activeAccountId: targetAccount.id,
                accountType: targetAccount.accountType,
                organizationId: targetAccount.organizationId,
                organizationName: targetAccount.organizationName,
                updatedAt: new Date().toISOString()
            };

            // This would need to be implemented in your Firestore service
            // const result = await firestoreService.user.updateActiveAccount(currentUser.uid, updateData);
            
            // For now, we'll restore auth with the new account info
            actions.auth.restoreAuth({
                user: {
                    ...currentUser,
                    organizationId: targetAccount.organizationId,
                    organizationName: targetAccount.organizationName,
                    accountType: targetAccount.accountType
                },
                profile: {
                    ...userProfile,
                    ...updateData
                },
                accountType: targetAccount.accountType
            });

            return { success: true };
        } catch (error) {
            console.error('Fallback account switch failed:', error);
            return { success: false, error: error.message };
        }
    };

    // Fallback method for account removal if not implemented in auth slice
    const removeAccountFallback = async (accountToRemove) => {
        try {
            // Remove account from availableAccounts array
            const updatedAvailableAccounts = availableAccounts.filter(acc => 
                !(acc.id === accountToRemove.id && 
                  acc.accountType === accountToRemove.accountType &&
                  acc.organizationId === accountToRemove.organizationId)
            );

            // This would need to be implemented in your Firestore service
            // const result = await firestoreService.user.updateAvailableAccounts(currentUser.uid, updatedAvailableAccounts);
            
            // For now, we'll just update the local state
            actions.auth.restoreAuth({
                user: currentUser,
                profile: {
                    ...userProfile,
                    availableAccounts: updatedAvailableAccounts,
                    updatedAt: new Date().toISOString()
                },
                accountType: accountType
            });

            return { success: true };
        } catch (error) {
            console.error('Fallback account removal failed:', error);
            return { success: false, error: error.message };
        }
    };

    const getAccountDisplayName = (account) => {
        if (account.accountType === 'individual') {
            return 'Freelancer';
        }
        return account.organizationName || account.name || 'Organization';
    };

    const getAccountIcon = (accountType) => {
        return accountType === 'individual' ? User : Building2;
    };

    // Get account statistics for display
    const accountStats = {
        personal: allAccounts.filter(acc => acc.accountType === 'individual').length,
        organization: allAccounts.filter(acc => acc.accountType === 'organization').length,
        total: allAccounts.length
    };

    // Loading state
    if (loading && !currentUser) {
        return (
            <div className="flex items-center justify-center w-full h-12 p-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const currentDisplayName = getCurrentAccountDisplayName();
    const CurrentAccountIcon = getAccountIcon(accountType);

    if (isCollapsed) {
        return (
            <>
                <div className="relative group">
                    <div className="flex items-center justify-center w-full h-12 p-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md relative">
                            <CurrentAccountIcon className="h-4 w-4 text-white" />
                            {allAccounts.length > 1 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-bold">{allAccounts.length}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Tooltip for collapsed state */}
                    <div className="hidden lg:group-hover:block absolute left-full top-0 ml-6 px-3 py-2 bg-background/90 backdrop-blur-sm text-foreground text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200 ease-in-out shadow-theme border border-border">
                        <div className="relative">
                            {currentDisplayName}
                            {allAccounts.length > 1 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    {allAccounts.length} accounts available
                                </div>
                            )}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-background/90 border-l border-t border-border rotate-45 transform"></div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={loading}
                    className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0 relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                                ) : (
                                    <CurrentAccountIcon className="h-4 w-4 text-white" />
                                )}
                            </div>
                            {allAccounts.length > 1 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-bold">{allAccounts.length}</span>
                                </div>
                            )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                                {currentDisplayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {isIndividual ? 'Personal Account' : 'Organization'} 
                                {allAccounts.length > 1 && ` • ${allAccounts.length} accounts`}
                            </div>
                        </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-theme-lg z-50 overflow-hidden">
                        <div className="py-2">
                            {/* Current Account */}
                            <div className="px-3 py-2 border-b border-border">
                                <div className="flex items-center space-x-2">
                                    <CurrentAccountIcon className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-foreground">
                                            {currentDisplayName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {currentUser?.email}
                                        </div>
                                    </div>
                                    <Check className="h-4 w-4 text-teal-600" />
                                </div>
                            </div>

                            {/* Account Statistics */}
                            {allAccounts.length > 1 && (
                                <div className="px-3 py-2 bg-muted/30">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Available Accounts</span>
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center space-x-1">
                                                <User className="h-3 w-3" />
                                                <span>{accountStats.personal}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Building2 className="h-3 w-3" />
                                                <span>{accountStats.organization}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Other Available Accounts */}
                            {allAccounts.length > 1 && (
                                <div className="py-1">
                                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center">
                                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                                        Switch Account
                                    </div>
                                    {allAccounts.map((account) => {
                                        const isCurrentAccount = account.id === currentUser?.uid && 
                                                               account.accountType === accountType &&
                                                               account.organizationId === userProfile?.organizationId;
                                        
                                        if (isCurrentAccount) return null;
                                        
                                        const AccIcon = getAccountIcon(account.accountType);
                                        const accDisplayName = getAccountDisplayName(account);
                                        const isSwitching = switchingAccount === account.id;
                                        const isRemoving = removingAccount === account.id;
                                        
                                        return (
                                            <div
                                                key={`${account.id}-${account.accountType}-${account.organizationId || 'personal'}`}
                                                className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/80 transition-colors duration-200 group"
                                            >
                                                <button
                                                    onClick={() => handleSwitchAccount(account)}
                                                    disabled={isSwitching || isRemoving}
                                                    className="flex items-center flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSwitching ? (
                                                        <Loader2 className="h-4 w-4 mr-2 text-muted-foreground animate-spin" />
                                                    ) : (
                                                        <AccIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    )}
                                                    <div className="flex-1 text-left">
                                                        <div className="font-medium">{accDisplayName}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {account.email || currentUser?.email}
                                                        </div>
                                                    </div>
                                                    {account.accountType === 'organization' && (
                                                        <Users className="h-3 w-3 text-muted-foreground mr-2" />
                                                    )}
                                                </button>
                                                
                                                {/* Remove Account Button */}
                                                <button
                                                    onClick={(e) => handleRemoveAccount(account, e)}
                                                    disabled={isRemoving || isSwitching}
                                                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Remove account"
                                                >
                                                    {isRemoving ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <X className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add Account */}
                            <div className="py-1">
                                <button
                                    onClick={handleAddAccount}
                                    className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/80 transition-colors duration-200"
                                >
                                    <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Add Account
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-border my-1"></div>

                            {/* Account Actions */}
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        window.location.href = '/profile-settings';
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/80 transition-colors duration-200"
                                >
                                    <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Account Settings
                                </button>

                                {/* Multi-Account Management */}
                                {allAccounts.length > 1 && (
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            window.location.href = '/account-management';
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/80 transition-colors duration-200"
                                    >
                                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                        Manage Accounts
                                        <span className="ml-auto text-xs text-teal-600">
                                            {allAccounts.length}
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* Account switching/removal status */}
                            {(switchingAccount || removingAccount) && (
                                <div className="mx-3 my-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-xs text-blue-800 flex items-center">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        {switchingAccount ? 'Switching accounts...' : 'Removing account...'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Account Modal - Portal to document body for proper overlay */}
            {typeof window !== 'undefined' && createPortal(
                showAddAccountModal ? (
                    <AddAccountModal
                        isOpen={true}
                        onClose={() => setShowAddAccountModal(false)}
                        currentUser={currentUser}
                        currentAccountType={accountType}
                        onAccountAdded={handleAccountAdded}
                    />
                ) : null,
                document.body
            )}
        </>
    );
};

export default AccountSection;