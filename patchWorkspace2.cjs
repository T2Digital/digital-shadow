const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceExplorer.tsx', 'utf8');

c = c.replace(/onClick={async \(\) => {[\s\S]*?className='absolute top-36/m, `onClick={async () => {
             alert('جاري المزامنة الشاملة مع السحابة...');
             try {
                const { collection, getDocs, query } = await import('firebase/firestore');
                const { shadowDB } = await import('../services/dbService');
                const { db } = await import('../services/firebaseConfig');
                
                const snap1 = await getDocs(query(collection(db, \\\`users/\${userId.toLowerCase()}/filesystem\\\`)));
                const snap2 = await getDocs(query(collection(db, \\\`users/\${userId.toLowerCase()}/projects\\\`)));
                
                const dbLocal = await shadowDB.init();
                const tx = dbLocal.transaction('fs', 'readwrite');
                const store = tx.objectStore('fs');
                
                let count = 0;
                snap1.forEach(d_doc => {
                    const d = d_doc.data();
                    const parsedId = Number(d_doc.id);
                    d.id = d.id || (!isNaN(parsedId) ? parsedId : d_doc.id);
                    if (d.parentId === 'null' || d.parentId === undefined) d.parentId = null;
                    if (!d.userId || d.userId === 'GUEST') d.userId = userId;
                    store.put(d);
                    count++;
                });
                
                snap2.forEach(d_doc => {
                    const d = d_doc.data();
                    const parsedId = Number(d_doc.id);
                    d.id = d.id || (!isNaN(parsedId) ? parsedId : d_doc.id);
                    
                    const fsItem = {
                        id: d.id,
                        userId: userId,
                        parentId: null,
                        name: d.name || 'مشروع',
                        type: 'project',
                        content: JSON.stringify(d),
                        createdAt: d.createdAt,
                        updatedAt: d.updatedAt,
                        synced: true,
                        tags: d.tags || []
                    };
                    store.put(fsItem);
                    count++;
                });

                tx.oncomplete = () => {
                   alert('تمت المزامنة بنجاح! تم العثور على ' + count + ' عنصر.');
                   window.dispatchEvent(new CustomEvent('shadow_fs_update'));
                };
             } catch(e: any) {
                console.error(e);
                alert('حدث خطأ أثناء المزامنة: ' + e.message);
             }
        }}
        className='absolute top-36`);

fs.writeFileSync('components/WorkspaceExplorer.tsx', c);
