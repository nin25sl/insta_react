//rafceのコンポーネントを使用
import React from 'react';
import { appDispatch, AppDispatch } from '../../app/store';
import { useSelector, useDispatch } from 'react-redux';
import styles from "./Auth.module.css";
//フォームバリデーション
import Modal, { defaultStyles } from 'react-modal';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { fetchCredStart, fetchCredEnd, setOpenSignIn, resetOpenSignIn, setOpenSignUp, resetOpenSignUp, setOpenProfile, resetOpenProfile, fetchAsyncCreateProf, fetchAsyncGetProfs, fetchAsyncGetMyProf, fetchAsyncLogin, fetchAsyncRegister, fetchAsyncUpdateProf, selectOpenSignIn, selectOpenSignUp, selectIsLoadingAuth } from "./authSlice";

import { TextField, Button, CircularProgress} from '@material-ui/core';
import { divide } from 'lodash';

//モーダルのスタイル定義
const customStyle = {
    //overlayはバックグラウンドのカラーを設定
    overlay: {
        backgroundColor: "#777777",
    },
    //contentはモーダルの位置や幅を設定している。
    content: {
        top: "55%",
        left: "50%",

        width: 200,
        height: 350,
        padding: "50px",

        //モーダルの幅の半分と高さの半分をずらすことで、調整している。
        transform: "translate(-50%, -50%)"
    },
};

//typeScriptの場合、React.FCという型を追記する必要あり。
const auth: React.FC = () => {
    //DOMのIDを指定する必要あり、reactプロジェクト内のindex.tsxに記載があるため、合わせる。
    Modal.setAppElement("#root")
    //useSelecterを使用し、authSlice.tsのopenSignInの状態を取得する。
    const setOpenSignIn = useSelector(selectOpenSignIn)
    const setOpenSignUp = useSelector(selectOpenSignUp)
    const isLoadingAuth = useSelector(selectIsLoadingAuth)

    //appDispatch型を定義
    const dispatch: AppDispatch = useDispatch()

    return (
        <>
            <Modal isOpen={setOpenSignUp}
                onRequestClose={async () => {
                    await dispatch(resetOpenSignUp())
                }}
                //定義したcustomスタイルを使用
                style={customStyle}
            >
                     {/*formik使い方 ->note  */}
            <Formik
            initialErrors={{ email: "required" }}
            initialValues={{ email: "", password: "" }}
            onSubmit={async (values) => {
              await dispatch(fetchCredStart());
              const resultReg = await dispatch(fetchAsyncRegister(values));
                // サインアップに成功した場合は、そのままログインする（JWTトークンを作成）
              if (fetchAsyncRegister.fulfilled.match(resultReg)) {
                await dispatch(fetchAsyncLogin(values));
                // anonymousでプロフィールを作成（初期値）
                await dispatch(fetchAsyncCreateProf({ nickName: "anonymous" }));
                // プロフィールの一蘭を取得
                await dispatch(fetchAsyncGetProfs());
                //await dispatch(fetchAsyncGetPosts());
                //await dispatch(fetchAsyncGetComments());
                // ログインユーザの情報を取得
                await dispatch(fetchAsyncGetMyProf());
              }
              // 
              await dispatch(fetchCredEnd());
              // モーダルを閉じる
              await dispatch(resetOpenSignUp());
            }}
            // validationの内容を定義
            validationSchema={Yup.object().shape({
                // email -> emailのフォーマットに準拠しているか
                //required -> 上で定義
              email: Yup.string()
                .email("email format is wrong")
                .required("email is must"),
                // 必要最小文字数は4文字, 最大はMAX
              password: Yup.string().required("password is must").min(4),
            })}
          >
        {/* formikの雛形、あらかじめ用意されているハンドラー */}
        {/* handleはhandler */}
        {/* values: ユーザの入力を取得 */}
        {/* touched: 入力フォーカスに一度でもタッチするとtrueに変更される */}
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            errors,
            touched,
            isValid,
          }) => <div>
              <form onSubmit={handleSubmit}>
                  <div className={styles.auth_signUp}>
                      <h1 className={styles.auth_title}>SNS clone</h1>
                      <br />
                      {/* isLoadingAuthがtrueのとき、materialUIのCircularProgressが表示される */}
                      <div className={styles.auth_progress}>
                          {isLoadingAuth && <CircularProgress />}
                      </div>
                      <br />
                      {/* handleChange->ユーザがチェンジするたびに、実行される */}
                      {/* onBluer -> focusを外したときに発生するイベント */}
                      <TextField 
                      placeholder="email"
                      type="input"
                      name="email"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.email}/>
                      <br />
                      {/* エラーメッセージを表示  エラーメッセージのときの処理 or null*/}
                      {touched.email && errors.email ? (
                    <div className={styles.auth_error}>{errors.email}</div>
                  ) : null}

                  <br />

                  <TextField
                    placeholder="password"
                    type="password"
                    name="password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                  />
                  {touched.password && errors.password ? (
                    <div className={styles.auth_error}>{errors.password}</div>
                  ) : null}
                  <br />
                  <br />
                  {/* material-uiのbutton */}
                  {/* variant:ボタンの外見の決定 */}
                  {/* primary; 青っぽい色 */}
                  {/* isValidが有効で無いときにボタンを押せない様にする */}
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!isValid}
                    type="submit"
                  >
                    Register
                  </Button>
                  <br />
                  <br />
                  <span
                    className={styles.auth_text}
                    onClick={async () => {
                      // await dispatch(setOpenSignIn());
                      await dispatch(resetOpenSignUp());
                    }}
                  >
                    You already have a account ?
                  </span>
                  </div>
              </form>
              </div>}
              </Formik></Modal>
        </>
    )
}

export default auth
