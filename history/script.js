let img_preview;
let slides;
    let activeIndex = 0;

function smoothScroll(element, target, duration) {
    target = Math.round(target);
    duration = Math.round(duration);
    if (duration < 0) {
        return Promise.reject("bad duration");
    }
    if (duration === 0) {
        element.scrollTop = target;
        return Promise.resolve();
    }

    var start_time = Date.now();
    var end_time = start_time + duration;

    var start_top = element.scrollTop;
    var distance = target - start_top;

    var smooth_step = function (start, end, point) {
        if (point <= start) { return 0; }
        if (point >= end) { return 1; }
        var x = (point - start) / (end - start);
        return x * x * (3 - 2 * x);
    }

    return new Promise(function (resolve, reject) {
        var previous_top = element.scrollTop;

        var scroll_frame = function () {
            if (element.scrollTop != previous_top) {
                resolve();
                return;
            }

            var now = Date.now();
            var point = smooth_step(start_time, end_time, now);
            var frameTop = Math.round(start_top + (distance * point));
            element.scrollTop = frameTop;

            if (now >= end_time) {
                resolve();
                return;
            }

            if (element.scrollTop === previous_top && element.scrollTop !== frameTop) {
                resolve();
                return;
            }
            previous_top = element.scrollTop;

            setTimeout(scroll_frame, 0);
        }
        setTimeout(scroll_frame, 0);
    });
}

function filterList() {
    var input = document.getElementById('searchInput');
    var filter = input.value.toLowerCase();
    var list = document.getElementById("commits");
    var listItems = list.getElementsByTagName('li');
    
    Array.from(listItems).forEach(function(item) {
        if (item.textContent.toLowerCase().indexOf(filter) > -1) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}

function reformatTimestamp(timestamp) {
    // Eingabedatum und -zeit mit Zeitzone
    let date = new Date(timestamp);
  
    // Einzelne Komponenten des Datums und der Zeit extrahieren
    let year = date.getFullYear().toString().slice(2); // Nur die letzten beiden Ziffern des Jahres
    let month = String(date.getMonth() + 1).padStart(2, '0'); // Monate sind 0-indiziert
    let day = String(date.getDate()).padStart(2, '0');
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');
  
    // Zusammenführen der Komponenten im gewünschten Format
    let formattedTimestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
  
    return formattedTimestamp;
  }

  function extractHash(inputString) {
    // Muster für den Hash finden
    let hashPattern = /hash:\s(0x[a-fA-F0-9]{64})/;
    
    // Den Hash aus dem String extrahieren
    let match = inputString.match(hashPattern);
    
    // Überprüfen, ob ein Hash gefunden wurde und zurückgeben
    if (match) {
      return match[1];
    } else {
      return null; // Falls kein Hash gefunden wurde
    }
  }



function loaded(){
    img_preview = document.querySelector('#preview');
    console.log(img_preview)
    var list = document.getElementById("commits");
    var listItems = Array.from(list.querySelectorAll("li"));
    let currentItem = 0;
    listItems[currentItem].classList.add("active");
    // img_preview.src = listItems[currentItem].getAttribute('data-img');


    document.getElementById('searchInput').addEventListener('input', function() {
        filterList();
        listItems = Array.from(list.querySelectorAll("li"));
        currentItem = listItems.findIndex(item => item.classList.contains("active"));
        if (currentItem === -1 && listItems.length > 0) {
            currentItem = 0;
            listItems[currentItem].classList.add("active");

        }
        // img_preview.src = listItems[currentItem].getAttribute('data-img');

    });

  

    listItems.forEach(function (item, index) {
        item.addEventListener("click", function (e) {
            listItems[currentItem].classList.remove("active");
            e.target.classList.add("active");
            smoothScroll(list, e.target.offsetTop - list.offsetTop, 250);
            currentItem = index;
        });
    });

    

    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 40) { // down arrow key
            event.preventDefault();
            var nextItem = listItems[currentItem + 1];
            if (nextItem) {
                listItems[currentItem].classList.remove("active");
                nextItem.classList.add("active");
                smoothScroll(list, nextItem.offsetTop - list.offsetTop, 250);
                console.log( nextItem.getAttribute('data-img'))
                // img_preview.src = nextItem.getAttribute('data-img');
                // img_preview.setAttribute('src', nextItem.getAttribute('data-img'));
                currentItem++;
                setActiveSlide(currentItem);
            }
        } else if (event.keyCode === 38) { // up arrow key
            event.preventDefault();
            var prevItem = listItems[currentItem - 1];
            if (prevItem) {
                listItems[currentItem].classList.remove("active");
                prevItem.classList.add("active");
                // img_preview.src = prevItem.getAttribute('data-img');

                smoothScroll(list, prevItem.offsetTop - list.offsetTop, 250);
                currentItem--;
                setActiveSlide(currentItem);

            }
        }
        // Check for Cmd+K on Mac
        if (event.metaKey && event.key === 'k') {
            event.preventDefault();
            document.getElementById('searchInput').focus();
        }

        // Check for Ctrl+K on Windows/Linux
        if (event.ctrlKey && event.key === 'k') {
            event.preventDefault();
            document.getElementById('searchInput').focus();
        }
        // Check for Cmd+K on Mac
        if (event.metaKey && event.key === 'ArrowRight') {
            event.preventDefault();
            // document.getElementById('searchInput').focus();
            const activeElement = document.querySelector('li.active');
            if (activeElement) {
                // Log the value of its data-hash attribute
                const dataHash = activeElement.getAttribute('data-hash');
                console.log('Active element data-hash:', dataHash);
                checkoutCommit(dataHash)
            } else {
                console.log('No active element found.');
            }
        }

        // Check for Ctrl+K on Windows/Linux
        if (event.ctrlKey && event.key === 'ArrowRight') {
            event.preventDefault();
            const activeElement = document.querySelector('li.active');
            if (activeElement) {
                // Log the value of its data-hash attribute
                const dataHash = activeElement.getAttribute('data-hash');
                console.log('Active element data-hash:', dataHash);
                checkoutCommit(dataHash)
            } else {
                console.log('No active element found.');
            }
            // document.getElementById('searchInput').focus();
        }
    });
    slides = document.querySelectorAll('.slide');
    setActiveSlide(activeIndex);

    document.getElementById('searchInput').focus();
}

function formatDateTime(isoString) {
    // Create a new Date object from the ISO string
    const date = new Date(isoString);

    // Get the individual components of the date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Format the date and time
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    return formattedDate;
}



async function fetchCommits() {
    const response = await fetch('/commits');

    const commits = await response.json();
    const commitsList = document.getElementById('commits');
    const slider = document.getElementById('slider');
    commitsList.innerHTML = '';
    commits.forEach((commit,i) => {
        const tmp_time = reformatTimestamp(commit.date);
        const tmp_hash = extractHash(commit.message);


        commit.image = "/project/download/"+tmp_time + "_" + commit.hash + "_" +tmp_hash+"_s.webp";
        const slide = document.createElement('img');
        slide.src = commit.image;
        slide.classList.add('slide')
        


        const listItem = document.createElement('li');
        listItem.setAttribute('tabindex', i);
        listItem.setAttribute('data-hash', commit.hash);
        listItem.setAttribute('data-img', commit.image);
        if(i == 0){
            listItem.classList.add('active')
            slide.classList.add('active')
        }
        slider.appendChild(slide);
        listItem.innerHTML = `<div class="flex"><div class="commit-text"><div class="status ${(commit.refs.includes('HEAD') && !commit.refs.includes('origin')) ? 'head' : ''}">●</div>${formatDateTime(commit.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${commit.hash}</div> <div><span class="btn">CMD</span> <span class="btn">→</span></div> </div>`;
        // listItem.innerHTML = `${commit.message} / ${commit.refs}`;
        
        // if(commit.refs != "HEAD"){
        //     const checkoutButton = document.createElement('button');
        //     checkoutButton.textContent = 'Checkout';
        //     checkoutButton.onclick = () => checkoutCommit(commit.hash);
        //     listItem.appendChild(checkoutButton);
        // }
        commitsList.appendChild(listItem);
    });
    console.log(commits);

    loaded();
}

async function checkoutCommit(commitHash) {
    const response = await fetch('/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commitHash })
    });
    const result = await response.json();
    if (result.success) {
        alert(`Checked out commit: ${commitHash}`);
        location.reload();
    } else {
        alert('Error checking out commit');
    }
}

fetchCommits();



function setActiveSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });

    const slider = document.querySelector('.slider');
    const activeSlide = slides[index];
    const offset = (slider.offsetWidth / 2) - (activeSlide.offsetWidth / 2);
    slider.style.transform = `translateX(-${activeSlide.offsetLeft - offset}px)`;
}

function activateSlide(index) {
    if (index >= 0 && index < slides.length) {
        activeIndex = index;
        setActiveSlide(index);
    }
}

