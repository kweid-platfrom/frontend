import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../firebase/config';

const HandleEmailVerification = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const handleVerification = async () => {
            const actionCode = searchParams.get('oobCode');
            
            if (actionCode) {
                try {
                    await applyActionCode(auth, actionCode);
                    // Redirect to verification page to complete the process
                    navigate('/verify-email');
                } catch (error) {
                    console.error('Error applying action code:', error);
                    navigate('/verify-email');
                }
            } else {
                navigate('/verify-email');
            }
        };

        handleVerification();
    }, [searchParams, navigate]);

    return <div>Processing verification...</div>;
};

export default HandleEmailVerification;