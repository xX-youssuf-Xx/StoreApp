import React from 'react'
import { useFirebase } from '../context/FirebaseContext'

function LogoutComponent() {
    const { backup } = useFirebase();

    const logout = async () => {
        // JOE: DO BACKING UP UI
        const result = await backup();
        if(result) {
            // JOE: DO SUCCESS BACKUP UI THEN GO TO THERE IS NO ACTIVE USER SCREEN
        }
    }

    return (
        <div>LogoutComponent</div>
    )
}

export default LogoutComponent