
      {/* ========================================================================= */}
      {isAuthenticated && (
        <div className={`p-4 md:p-8 max-w-6xl mx-auto transition-all duration-1000 transform relative z-10 h-full overflow-y-auto ${isLoaded && isAuthenticated ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-2 drop-shadow-lg">
                Kawsay <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 drop-shadow-none">Eco-Dash</span>
              </h1>
              {/* SALUDO PERSONALIZADO AQUÍ */}
              <p className="text-emerald-200/90 mt-2 font-medium text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse drop-shadow-md" /> 
                Hola <span className="text-white font-bold">{userName}</span>, tu huella verde de hoy
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowGoalModal(true)}
                className="group flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-3 rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/20 hover:border-emerald-300/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-white font-bold text-sm w-full sm:w-auto justify-center"
              >
                <SlidersHorizontal className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 text-emerald-300" />
                Ajustar Metas
              </button>

              <button 
                onClick={() => setShowStreakModal(true)}
                className="group flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/20 hover:shadow-[0_8px_30px_rgba(251,146,60,0.4)] hover:border-orange-300/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
              >
                <div className="bg-gradient-to-tr from-orange-400 to-yellow-400 p-2 rounded-full shadow-[0_0_15px_rgba(251,146,60,0.5)] text-white group-hover:scale-110 transition-transform">
                  <Flame className="w-5 h-5 animate-bounce" />
                </div>
                <span className="font-black text-xl text-white drop-shadow-md">
                  {streak} <span className="text-emerald-100 font-medium text-base group-hover:text-white transition-colors">Días</span>
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(4,120,87,0.6)] border border-white/10 transition-all duration-500 relative overflow-hidden group hover:-translate-y-1">
                <div className="absolute -right-20 -top-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute -right-6 -top-6 text-white/20 group-hover:rotate-12 transition-transform duration-700">
                  <Leaf className="w-64 h-64 drop-shadow-2xl" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-green-50 font-bold tracking-widest uppercase text-sm mb-3 flex items-center gap-2 drop-shadow-md">
                    <Target className="w-4 h-4" /> Puntaje Kawsay Total
                  </h2>
                  <div className="flex items-end gap-3">
                    <span className="text-7xl font-black text-white drop-shadow-xl tracking-tighter">{totalScore}</span>
                    <span className="text-2xl font-bold text-green-900 mb-2 flex items-center bg-white/90 backdrop-blur-sm px-3 py-1 rounded-2xl shadow-lg border border-white">
                      <TrendingUp className="w-6 h-6 mr-1"/> pts
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20 hover:shadow-green-500/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl shadow-inner transition-transform duration-300 border border-white">
                        <AnimatedWindIcon className="w-8 h-8 text-green-700" />
                      </div>
                      <span className="text-green-700 font-black bg-white px-4 py-1.5 rounded-full text-xs tracking-widest uppercase border border-green-200 shadow-sm">
                        ODS 13
                      </span>
                    </div>
                    <h3 className="text-stone-500 font-bold uppercase tracking-wider text-xs mb-1">CO2 Evitado</h3>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-5xl font-black text-stone-800 tracking-tighter">{co2}</span>
                      <span className="text-stone-500 font-bold">kg</span>
                    </div>
                    <div className="w-full bg-stone-200/50 rounded-full h-4 mb-2 overflow-hidden shadow-inner border border-stone-200/50">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.8)] relative" style={{ width: `${co2Percent}%` }}>
                        <div className="absolute inset-0 bg-white/30 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                      </div>
                    </div>
                  </div>
                  {co2 >= goalCo2 ? (
                    <div className="mt-3 bg-green-100/90 border border-green-300 px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                      <Sparkles className="w-4 h-4 text-green-600 animate-pulse" />
                      <span className="text-green-700 font-black text-xs uppercase tracking-widest">¡Meta Clima Lista!</span>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 font-bold flex justify-between uppercase tracking-wide mt-3 px-1">
                      <span>Progreso</span><span>Meta: {goalCo2}kg</span>
                    </p>
                  )}
                </div>

                <div className="bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20 hover:shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-2xl shadow-inner transition-transform duration-300 border border-white">
                        <AnimatedHeartIcon className="w-8 h-8 text-orange-600" />
                      </div>
                      <span className="text-orange-700 font-black bg-white px-4 py-1.5 rounded-full text-xs tracking-widest uppercase border border-orange-200 shadow-sm">
                        ODS 3
                      </span>
                    </div>
                    <h3 className="text-stone-500 font-bold uppercase tracking-wider text-xs mb-1">Calorías Quemadas</h3>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-5xl font-black text-stone-800 tracking-tighter">{calories}</span>
                      <span className="text-stone-500 font-bold">kcal</span>
                    </div>
                    <div className="w-full bg-stone-200/50 rounded-full h-4 mb-2 overflow-hidden shadow-inner border border-stone-200/50">
                      <div className="bg-gradient-to-r from-orange-400 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,146,60,0.8)] relative" style={{ width: `${calPercent}%` }}>
                        <div className="absolute inset-0 bg-white/30 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                      </div>
                    </div>
                  </div>
                  {calories >= goalCalories ? (
                    <div className="mt-3 bg-orange-100/90 border border-orange-300 px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                      <Flame className="w-4 h-4 text-orange-600 animate-pulse" />
                      <span className="text-orange-700 font-black text-xs uppercase tracking-widest">¡Meta Salud Lista!</span>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 font-bold flex justify-between uppercase tracking-wide mt-3 px-1">
                      <span>Progreso</span><span>Meta: {goalCalories} kcal</span>
                    </p>
                  )}
                </div>

              </div>
            </div>

            <div className="flex flex-col gap-6">
              
              <div className="bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20">
                <h2 className="text-xl font-black text-stone-800 mb-5 flex items-center gap-2">
                  <Leaf className="w-6 h-6 text-green-600"/> Siembra una acción
                </h2>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => handleAction('clima')} 
                    disabled={co2 >= goalCo2}
                    className={`group relative overflow-hidden flex items-center gap-5 bg-white border-2 p-4 rounded-2xl transition-all duration-300 text-left 
                      ${co2 >= goalCo2 ? 'border-stone-200 opacity-60 cursor-not-allowed grayscale' : 'border-green-100 hover:border-green-400 active:scale-[0.97] shadow-sm hover:shadow-[0_10px_20px_rgba(74,222,128,0.3)]'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
                    <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-500/40 z-10 transition-transform text-white border border-green-300">
                      <AnimatedWindIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="z-10">
                      <h3 className={`font-black text-lg ${co2 >= goalCo2 ? 'text-stone-500' : 'text-stone-800 group-hover:text-green-900'} transition-colors`}>
                        Apagar A/C
                      </h3>
                      <p className="text-stone-500 text-sm font-bold">+1.5kg CO2 evitado</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleAction('salud')} 
                    disabled={calories >= goalCalories}
                    className={`group relative overflow-hidden flex items-center gap-5 bg-white border-2 p-4 rounded-2xl transition-all duration-300 text-left 
                      ${calories >= goalCalories ? 'border-stone-200 opacity-60 cursor-not-allowed grayscale' : 'border-orange-100 hover:border-orange-400 active:scale-[0.97] shadow-sm hover:shadow-[0_10px_20px_rgba(251,146,60,0.3)]'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-rose-50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
                    <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-3 rounded-xl shadow-lg shadow-orange-500/40 z-10 transition-transform text-white border border-orange-300">
                      <AnimatedHeartIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="z-10">
                      <h3 className={`font-black text-lg ${calories >= goalCalories ? 'text-stone-500' : 'text-stone-800 group-hover:text-orange-900'} transition-colors`}>
                        Movilidad Activa
                      </h3>
                      <p className="text-stone-500 text-sm font-bold">+250 Calorías quemadas</p>
                    </div>
                  </button>
                </div>
              </div>

              {showReward && (
                <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 border-2 border-yellow-400 p-7 rounded-[2rem] shadow-[0_15px_40px_rgba(253,224,71,0.5)] animate-in slide-in-from-bottom-8 duration-500 hover:scale-105 hover:shadow-[0_20px_50px_rgba(253,224,71,0.7)] transition-all cursor-default">
                  <div className="absolute inset-0 w-full h-full efecto-shiny mix-blend-overlay opacity-60 z-0"></div>
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-yellow-400 opacity-40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-4 rounded-2xl shadow-lg shadow-yellow-500/50 text-white border border-yellow-300 animar-libro group-hover:-rotate-12 transition-transform">
                      <BookOpen className="w-7 h-7 drop-shadow-md" />
                    </div>
                    <div>
                      <span className="text-yellow-800 font-black text-xs uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-600 animate-pulse" /> Recompensa ODS 4
                      </span>
                      <h3 className="font-black text-stone-800 text-xl leading-none mt-1 group-hover:text-amber-700 transition-colors">Semilla de Saber</h3>
                    </div>
                  </div>
                  <div className="relative z-10 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-inner group-hover:bg-white/60 transition-colors">
                    <p className="text-yellow-950 font-bold text-sm leading-relaxed">
                      Caminar 30 mins diarios reduce tu huella de carbono a cero y cuida tu corazón. ¡Cada paso es un respiro para el planeta!
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3">
                <button 
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full py-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 hover:bg-white/90 text-white hover:text-stone-800 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-95"
                >
                  <CalendarDays className="w-5 h-5" /> Ver todo mi historial
                </button>

                <button 
                  onClick={resetDashboard}
                  className="w-full py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 hover:bg-rose-500 hover:border-rose-400 text-white/70 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95 group"
                >
                  <RefreshCw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" /> Empezar de cero
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      